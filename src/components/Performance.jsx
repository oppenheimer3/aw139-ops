import { useState, useMemo, useEffect } from 'react';

const ALT_ENVELOPE = {
  '-40': [8.0, 14.0],
  '-30': [7.0, 14.0],
  '-20': [6.0, 14.0],
  '-10': [5.0, 13.7],
   '0': [4.0, 12.8],
  '10': [3.0, 11.9],
  '20': [2.0, 11.0],
  '30': [1.0, 10.2],
  '40': [0.0, 5.0],
  '50': [-1.0, 0.0],
};

const TEMP_CURVES = {
  '-40': [0.010281, -0.374574, 3.440963, 2.193912],
  '-30': [0.007078, -0.244227, 1.714885, 8.548067],
  '-20': [0.004387, -0.143440, 0.493109, 12.286300],
  '-10': [0.003997, -0.121654, 0.170303, 12.697106],
   '0': [0.003495, -0.095504, -0.181089, 13.062109],
  '10': [0.004326, -0.105109, -0.204753, 12.448276],
  '20': [0.003596, -0.078120, -0.487889, 12.321194],
  '30': [0.005064, -0.087904, -0.565247, 11.713136],
  '40': [0.014900, -0.153481, -0.570847, 11.017991],
  '50': [0.0,       -0.157241, -0.947476, 10.221442],
};

const WIND_CURVES = {
    0:  [0.00009604, -0.00432076, 0.06454475, -0.05118142, 42.00000000],
    1:  [0.00001807, -0.00078716, 0.01405346, 0.16698171, 44.01410763],
    2:  [-0.00001019, 0.00064946, -0.01575544, 0.17971033, -0.94339180, 1.98904011, 46.16941702],
    3:  [-0.00000167, 0.00010551, -0.00250646, 0.02765819, -0.13563356, 0.44375977, 48.00647222],
    4:  [-0.00003215, 0.00144520, -0.01225943, 0.19818644, 50.03072420],
    5:  [-0.00000970, 0.00048527, -0.00811625, 0.06020703, -0.01577782, 51.96710665],
    6:  [-0.00001385, 0.00063577, -0.00938985, 0.05790882, -0.02106544, 54.01447237],
    7:  [-0.00000656, 0.00030080, -0.00421891, 0.02926440, -0.01136529, 56.04549182],
    8:  [-0.00010809, 0.00430304, -0.03966242, 0.16666886, 58.05680155],
    9:  [-0.00005500, 0.00207848, -0.01332251, 0.07366890, 60.09872802],
   10: [0.00040989, -0.00417710, 0.11425155, 61.98943462],
};

function lin(x, x0, x1, y0, y1) {
  return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
}

function getAltBounds(oat) {
  const keys = Object.keys(ALT_ENVELOPE).map(Number).sort((a, b) => a - b);
  const c = Math.max(keys[0], Math.min(oat, keys[keys.length - 1]));
  if (ALT_ENVELOPE[String(c)]) {
    const b = ALT_ENVELOPE[String(c)];
    return { min: b[0] * 1000, max: b[1] * 1000 };
  }
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] < c && c < keys[i + 1]) {
      const b0 = ALT_ENVELOPE[String(keys[i])];
      const b1 = ALT_ENVELOPE[String(keys[i + 1])];
      return {
        min: lin(c, keys[i], keys[i + 1], b0[0], b1[0]) * 1000,
        max: lin(c, keys[i], keys[i + 1], b0[1], b1[1]) * 1000,
      };
    }
  }
  return { min: 0, max: 14000 };
}

function calculate(altitudeFt, oatC, headwindKts) {
  const yAlt = altitudeFt / 1000;
  const keys = Object.keys(TEMP_CURVES).map(Number).sort((a, b) => a - b);
  const clampedOat = Math.max(keys[0], Math.min(oatC, keys[keys.length - 1]));

  const evalT = (t, a) => {
    const c = TEMP_CURVES[String(t)];
    return c[0] * a ** 3 + c[1] * a ** 2 + c[2] * a + c[3];
  };

  let idx;
  if (TEMP_CURVES[String(clampedOat)]) {
    idx = evalT(clampedOat, yAlt);
  } else {
    for (let i = 0; i < keys.length - 1; i++) {
      if (keys[i] < clampedOat && clampedOat < keys[i + 1]) {
        const xl = evalT(keys[i], yAlt);
        const xh = evalT(keys[i + 1], yAlt);
        idx = xl + (clampedOat - keys[i]) / (keys[i + 1] - keys[i]) * (xh - xl);
        break;
      }
    }
  }

  const safeIdx = Math.max(0, Math.min(idx, 11));
  const w = Math.max(0, Math.min(headwindKts, 20));
  const windIdx = Math.min(safeIdx, 10);
  const lo = Math.floor(windIdx);
  const hi = Math.min(lo + 1, 10);

  const polyval = (coeffs, x) => {
    let r = 0;
    for (const c of coeffs) r = r * x + c;
    return r;
  };

  const evalW = (i, wv) => polyval(WIND_CURVES[i], wv);

  const wl = evalW(lo, w);
  const wh = evalW(hi, w);
  const fs = lo === hi ? wl : wl + (windIdx - lo) * (wh - wl);
  return { value: Math.min(fs * 100, 6400), safeIdx };
}

export default function Performance({ registration, onBack }) {
  const [temp, setTemp] = useState(15);
  const [altitude, setAltitude] = useState(2500);
  const [headwind, setHeadwind] = useState(10);
  const [flightDuration, setFlightDuration] = useState(0);
  const [latestTom, setLatestTom] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('aw139_saved_calcs_' + registration);
      if (raw) {
        const arr = JSON.parse(raw);
        if (arr.length > 0) {
          setLatestTom(arr[arr.length - 1].tom);
        }
      }
    } catch {}
  }, [registration]);

  const bounds = useMemo(() => getAltBounds(temp), [temp]);

  const clampedAlt = useMemo(() => {
    return Math.max(bounds.min, Math.min(altitude, bounds.max));
  }, [altitude, bounds]);

  const { value: maxGross, safeIdx } = useMemo(() => calculate(clampedAlt, temp, headwind), [clampedAlt, temp, headwind]);
  const remaining = Math.max(0, 6400 - maxGross);
  const fuelBurn = flightDuration * 410;
  const elw = latestTom !== null ? Math.max(0, latestTom - fuelBurn) : null;
  const destAuthorized = elw !== null && maxGross >= elw;
  const valueColor = latestTom === null ? '#ff9800'
    : maxGross >= latestTom + 100 ? '#4caf50'
    : maxGross < latestTom ? '#f44336'
    : '#ff9800';

  return (
    <div className="config-page">
      <div className="saved-page-content">
        <div style={{ marginBottom: 24 }}>
          {onBack && (
            <button onClick={onBack} className="perf-back-btn" style={{ marginBottom: 12 }}>← Back to Performance Hub</button>
          )}
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--cyan-300)', margin: 0 }}>Vertical Procedure — {registration}</h2>
        </div>

        <div className="perf-layout">
          <div className="perf-left">
            <div className="perf-inputs">
              <div className="perf-slider-group">
                <label className="perf-label">
                  Outside Air Temperature <span className="perf-value">{temp} °C</span>
                </label>
                <input type="range" min="-40" max="50" step="1" value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="perf-slider" />
                <div className="perf-range"><span>-40 °C</span><span>50 °C</span></div>
              </div>

              <div className="perf-slider-group">
                <label className="perf-label">
                  Pressure Altitude <span className="perf-value">{Math.round(clampedAlt)} ft</span>
                </label>
                <input type="range" min={Math.round(bounds.min)} max={Math.round(bounds.max)} step="50" value={Math.round(clampedAlt)}
                  onChange={(e) => setAltitude(Number(e.target.value))}
                  className="perf-slider" />
                <div className="perf-range"><span>{Math.round(bounds.min)} ft</span><span>{Math.round(bounds.max)} ft</span></div>
              </div>

              <div className="perf-slider-group">
                <label className="perf-label">
                  Headwind <span className="perf-value">{headwind} kts</span>
                </label>
                <input type="range" min="0" max="20" step="1" value={headwind}
                  onChange={(e) => setHeadwind(Number(e.target.value))}
                  className="perf-slider" />
                <div className="perf-range"><span>0 kts</span><span>20 kts</span></div>
              </div>

              <div className="perf-slider-group">
                <label className="perf-label">
                  Flight Duration to Destination <span className="perf-value">{flightDuration.toFixed(1)}h</span>
                </label>
                <input type="range" min="0" max="2.5" step="0.1" value={flightDuration}
                  onChange={(e) => setFlightDuration(Number(e.target.value))}
                  className="perf-slider" />
                <div className="perf-range"><span>0 hrs</span><span>2.5 hrs</span></div>
              </div>
            </div>

            <div className="perf-output">
              <hr className="perf-output-divider" />
              <div className="perf-output-section-label">Takeoff Performance Verification</div>
              <div className="perf-output-card">
                <div className="perf-output-label">Max Gross Weight</div>
                <div className="perf-output-value" style={{ color: valueColor }}>{Math.round(maxGross * 10) / 10} <span className="perf-unit">kg</span>                </div>
                {latestTom !== null && (
                  <div className={`perf-procedure ${maxGross >= latestTom ? 'perf-procedure-ok' : 'perf-procedure-no'}`}>
                    {maxGross >= latestTom
                      ? 'VERTICAL PROCEDURE AUTHORIZED AT TAKEOFF'
                      : 'VERTICAL PROCEDURE NOT AUTHORIZED AT TAKEOFF'}
                  </div>
                )}
                {latestTom === null && (
                  <div className="perf-procedure perf-procedure-na">
                    No saved calculation found
                  </div>
                )}
                <div className="perf-output-sub">
                  {latestTom !== null && <span>Takeoff Weight: {Math.round(latestTom * 10) / 10} kg</span>}
                  <span>Structural limit: 6,400 kg</span>
                </div>
              </div>

              <hr className="perf-output-divider" />
              <div className="perf-output-section-label">Destination Performance Verification</div>

              <div className="perf-output-card perf-dest-card">
                <div className="perf-output-label">Estimated Landing Weight</div>
                {latestTom !== null ? (
                  <>
                    <div className="perf-output-value" style={{ color: destAuthorized ? '#4caf50' : '#f44336' }}>{Math.round(elw * 10) / 10} <span className="perf-unit">kg</span></div>
                    <div className={`perf-procedure ${destAuthorized ? 'perf-procedure-ok' : 'perf-procedure-no'}`} style={{ marginTop: 16 }}>
                      {destAuthorized ? 'VERTICAL PROCEDURE AUTHORIZED AT DESTINATION' : 'VERTICAL PROCEDURE NOT AUTHORIZED AT DESTINATION'}
                    </div>
                    <div className="perf-output-sub" style={{ marginTop: 12 }}>
                      <span>{Math.floor(flightDuration)}h {Math.round((flightDuration % 1) * 60)}m flight</span>
                      <span style={{ color: '#f87171' }}>-{Math.round(fuelBurn * 10) / 10} kg fuel</span>
                    </div>
                  </>
                ) : (
                  <div className="perf-procedure perf-procedure-na" style={{ marginTop: 0 }}>
                    No saved TOM — complete a Weight & Balance calculation first
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="perf-chart-wrap">
            <svg className="perf-chart-overlay" viewBox="0 0 962 1280" preserveAspectRatio="xMidYMid meet">
              <line x1={153 + (safeIdx / 11) * (718 - 153)} y1={263}
                    x2={153 + (safeIdx / 11) * (718 - 153)} y2={917}
                    stroke="#f44336" strokeWidth="2.5" strokeDasharray="5,5" />
              <line x1={153} y1={917 + (clampedAlt / 14000) * (263 - 917)}
                    x2={718} y2={917 + (clampedAlt / 14000) * (263 - 917)}
                    stroke="#f44336" strokeWidth="2.5" strokeDasharray="5,5" />
              <circle cx={153 + (safeIdx / 11) * (718 - 153)}
                      cy={917 + (clampedAlt / 14000) * (263 - 917)}
                      r="8" fill="#ff9800" stroke="#fff" strokeWidth="2" />
              <line x1={153 + ((maxGross * 10) - 42000) / (66000 - 42000) * (768 - 153)}
                    y1={967}
                    x2={153 + ((maxGross * 10) - 42000) / (66000 - 42000) * (768 - 153)}
                    y2={1111}
                    stroke="#f44336" strokeWidth="2.5" strokeDasharray="5,5" />
              <line x1={153}
                    y1={967 + (headwind / 20) * (1111 - 967)}
                    x2={768}
                    y2={967 + (headwind / 20) * (1111 - 967)}
                    stroke="#f44336" strokeWidth="2.5" strokeDasharray="5,5" />
              <circle cx={153 + ((maxGross * 10) - 42000) / (66000 - 42000) * (768 - 153)}
                      cy={967 + (headwind / 20) * (1111 - 967)}
                      r="8" fill="#ff9800" stroke="#fff" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}