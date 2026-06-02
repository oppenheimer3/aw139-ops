import { useState, useEffect, useMemo } from 'react';

const BASE_EMPTY = { weight_kg: 4675.38, longMoment_kgmm: 25138328.12 };

function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

const LONG_ENVELOPE = [
  { x: 5180, y: 6400 },
  { x: 5504, y: 6400 },
  { x: 5595, y: 4850 },
  { x: 5536, y: 4400 },
  { x: 5071, y: 4400 },
  { x: 5000, y: 4660 },
  { x: 5000, y: 5170 },
];

const LAT_ENVELOPE = [
  { x: -88, y: 4400 },
  { x: -70, y: 6400 },
  { x: 0, y: 6400 },
  { x: 90, y: 6400 },
  { x: 120, y: 4400 },
  { x: 0, y: 4400 },
];

export function CgChart({ title, points, envelope, xDomain, yDomain, xLabel, yLabel, width, height }) {
  const pad = { top: 40, right: 16, bottom: 56, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const xScale = (v) => pad.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * plotW;
  const yScale = (v) => pad.top + plotH - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * plotH;

  const envPoints = envelope.map((p) => `${xScale(p.x)},${yScale(p.y)}`).join(' ');

  const xTicks = 5;
  const yTicks = 6;
  const xStep = (xDomain[1] - xDomain[0]) / xTicks;
  const yStep = (yDomain[1] - yDomain[0]) / yTicks;

  const linePoints = points.filter((p) => {
    const inside = p.x >= xDomain[0] && p.x <= xDomain[1] && p.y >= yDomain[0] && p.y <= yDomain[1];
    return inside;
  });
  const lineStr = linePoints.map((p) => `${xScale(p.x)},${yScale(p.y)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="cg-chart">
      <text x={width / 2} y={18} className="cg-title" textAnchor="middle">{title}</text>

      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const y = yDomain[0] + i * yStep;
        const sy = yScale(y);
        return (
          <g key={`yg-${i}`}>
            <line x1={pad.left} y1={sy} x2={pad.left + plotW} y2={sy} className="cg-gridline" />
            <text x={pad.left - 6} y={sy + 4} className="cg-label" textAnchor="end">{Math.round(y)}</text>
          </g>
        );
      })}
      {Array.from({ length: xTicks + 1 }, (_, i) => {
        const x = xDomain[0] + i * xStep;
        const sx = xScale(x);
        return (
          <g key={`xg-${i}`}>
            <line x1={sx} y1={pad.top} x2={sx} y2={pad.top + plotH} className="cg-gridline" />
            <text x={sx} y={pad.top + plotH + 16} className="cg-label" textAnchor="middle">{Math.round(x)}</text>
          </g>
        );
      })}

      <polygon points={envPoints} className="cg-env" />

      {lineStr && <polyline points={lineStr} className="cg-connect" />}

      {points.map((p, i) => {
        const inside = p.x >= xDomain[0] && p.x <= xDomain[1] && p.y >= yDomain[0] && p.y <= yDomain[1];
        if (!inside) return null;
        return <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={5} className={`cg-point-${i}`} />;
      })}

      <text x={pad.left + plotW / 2} y={height - 22} className="cg-axis-label" textAnchor="middle">{xLabel}</text>
      <text x={14} y={pad.top + plotH / 2} className="cg-axis-label" textAnchor="middle" transform={`rotate(-90, 14, ${pad.top + plotH / 2})`}>{yLabel}</text>

      <g transform={`translate(${pad.left}, ${height - 6})`}>
        {points.map((p, i) => (
          <g key={i} transform={`translate(${i * (width / points.length)}, 0)`}>
            <circle cx={0} cy={-4} r={3} className={`cg-point-${i}`} />
            <text x={8} y={0} className="cg-legend-label">{p.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function WeightBalanceCalc({ registration, payloadMass, payloadMoment, payloadLatMoment, mainFuel, auxFuel, missionType, username }) {
  const [bem, setBem] = useState({ weight_kg: BASE_EMPTY.weight_kg, longMoment_kgmm: BASE_EMPTY.longMoment_kgmm, staCg: 5376.75, latMoment_kgmm: -14480.0, blCg: -3.1 });

  useEffect(() => {
    const key = 'aw139_maint_' + registration;
    let w = BASE_EMPTY.weight_kg;
    let lm = BASE_EMPTY.longMoment_kgmm;
    let sta = 5376.75;
    let latM = -14480.0;
    let bl = -3.1;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const records = JSON.parse(raw);
        if (Array.isArray(records) && records.length > 0) {
          const last = records[records.length - 1];
          w = last.totalWeight_kg;
          lm = last.totalLongMoment_kgmm;
          sta = last.totalStaCg_mm;
          latM = last.totalLatMoment_kgmm || 0;
          bl = last.totalBlCg_mm || 0;
        }
      }
    } catch {}
    setBem({ weight_kg: w, longMoment_kgmm: lm, staCg: sta, latMoment_kgmm: latM, blCg: bl });
  }, [registration]);

  const pilotsMass = 160;
  const pilotsMoment = 160 * 2820;

  const oilMass = 16;
  const oilMoment = 16 * 6875;

  const mainMass = Math.min(parseFloat(mainFuel) || 0, 1254);
  const mainMoment = mainMass * 6232;

  const auxMass = Math.min(parseFloat(auxFuel) || 0, 400);
  const auxMoment = auxMass * 6234;

  const zfm = useMemo(() => ({
    mass: bem.weight_kg + payloadMass + oilMass + pilotsMass,
    moment: bem.longMoment_kgmm + payloadMoment + oilMoment + pilotsMoment,
  }), [bem, payloadMass, payloadMoment]);

  const takeoff = {
    mass: zfm.mass + mainMass + auxMass,
    moment: zfm.moment + mainMoment + auxMoment,
  };

  const toCg = takeoff.mass > 0 ? takeoff.moment / takeoff.mass : 0;
  const zfmCg = zfm.mass > 0 ? zfm.moment / zfm.mass : 0;

  const latMomentPayload = parseFloat(payloadLatMoment) || 0;
  const latMomentBem = bem.latMoment_kgmm || 0;
  const latMomentZfm = latMomentBem + latMomentPayload;
  const latMomentTo = latMomentBem + latMomentPayload;

  const payloadSta = payloadMass > 0 ? payloadMoment / payloadMass : 0;
  const payloadBl = payloadMass > 0 ? latMomentPayload / payloadMass : 0;
  const zfmBl = zfm.mass > 0 ? latMomentZfm / zfm.mass : 0;
  const toBl = takeoff.mass > 0 ? latMomentTo / takeoff.mass : 0;

  const cgInLong = takeoff.mass > 0 && pointInPolygon(toCg, takeoff.mass, LONG_ENVELOPE);
  const cgInLat = takeoff.mass > 0 && pointInPolygon(toBl, takeoff.mass, LAT_ENVELOPE);
  const cgWarning = !cgInLong || !cgInLat;

  const [saveMsg, setSaveMsg] = useState('');

  const handleSaveCalc = () => {
    const savedKey = 'aw139_saved_calcs_' + registration;
    let saved = [];
    try {
      const raw = localStorage.getItem(savedKey);
      if (raw) saved = JSON.parse(raw);
    } catch {}
    saved.push({
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      username,
      missionType,
      registration,
      tom: takeoff.mass,
      zfm: zfm.mass,
      toCg,
      zfmCg,
      toBl,
      zfmBl,
      bem: bem,
      payloadMass,
      payloadMoment,
      payloadLatMoment,
      mainFuel: mainMass,
      auxFuel: auxMass,
      cgWarning,
      rows,
    });
    localStorage.setItem(savedKey, JSON.stringify(saved));
    setSaveMsg('Calculation saved successfully');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const fmt = (v) => {
    if (typeof v === 'number') return Math.round(v * 100) / 100;
    return v;
  };

  const rows = [
    { label: 'Basic Empty Mass', mass: bem.weight_kg, longMoment: bem.longMoment_kgmm, sta: bem.staCg, latMoment: bem.latMoment_kgmm, bl: bem.blCg },
    { label: 'Pilots (2 x 80kg)', mass: pilotsMass, longMoment: pilotsMoment, sta: 2820, latMoment: 0, bl: 0 },
    { label: 'Payload', mass: payloadMass, longMoment: payloadMoment, sta: payloadSta, latMoment: latMomentPayload, bl: payloadBl },
    { label: 'Engine Oil (fixed 16kg)', mass: oilMass, longMoment: oilMoment, sta: 6875, latMoment: 0, bl: 0 },
    { label: 'Zero Fuel Mass', mass: zfm.mass, longMoment: zfm.moment, sta: zfmCg, latMoment: latMomentZfm, bl: zfmBl, bold: true },
    { label: 'Fuel Main Tank', mass: mainMass, longMoment: mainMoment, sta: mainMass > 0 ? mainMoment / mainMass : 6232, latMoment: 0, bl: 0 },
    { label: 'Fuel Aux Tank', mass: auxMass, longMoment: auxMoment, sta: auxMass > 0 ? auxMoment / auxMass : 6234, latMoment: 0, bl: 0 },
    { label: 'Takeoff Mass', mass: takeoff.mass, longMoment: takeoff.moment, sta: toCg, latMoment: latMomentTo, bl: toBl, bold: true },
  ];

  return (
    <div className="wbc-page">
      <div className="wbc-header">
        <h2>Weight & Balance Calculation — {registration}</h2>
      </div>

      <div className="wbc-body">
        <div className="wbc-charts">
          <CgChart
            title="Longitudinal CG Envelope"
            points={[
              { label: 'BEM', x: bem.staCg, y: bem.weight_kg },
              { label: 'ZFM', x: zfmCg, y: zfm.mass },
              { label: 'TOM', x: toCg, y: takeoff.mass },
            ]}
            envelope={LONG_ENVELOPE}
            xDomain={[4900, 5700]}
            yDomain={[3900, 6400]}
            xLabel="STA (mm)"
            yLabel="Gross Mass (kg)"
            width={360} height={260}
          />
          <CgChart
            title="Lateral CG Envelope"
            points={[
              { label: 'BEM', x: bem.blCg, y: bem.weight_kg },
              { label: 'ZFM', x: zfmBl, y: zfm.mass },
              { label: 'TOM', x: toBl, y: takeoff.mass },
            ]}
            envelope={LAT_ENVELOPE}
            xDomain={[-130, 130]}
            yDomain={[3900, 6400]}
            xLabel="BL (mm)"
            yLabel="Gross Mass (kg)"
            width={360} height={260}
          />
        </div>

        <div className="wbc-table-wrap">
          <table className="wbc-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Mass (kg)</th>
              <th>Long Moment</th>
              <th>STA</th>
              <th>Lat Moment</th>
              <th>BL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={r.bold ? 'wbc-total' : ''}>
                <td>{r.label}</td>
                <td className="num">{fmt(r.mass)}</td>
                <td className="num">{fmt(r.longMoment)}</td>
                <td className="num">{fmt(r.sta)}</td>
                <td className="num">{fmt(r.latMoment)}</td>
                <td className="num">{fmt(r.bl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={`wbc-capacity ${takeoff.mass > 6400 || cgWarning ? 'wbc-over' : ''}`}>
          <div className="wbc-capacity-left">
            <span>Remaining available Payload: {fmt(6400 - takeoff.mass)} kg</span>
            {takeoff.mass > 6400 && <span className="wbc-over-msg">Max gross weight exceeded!</span>}
            {cgWarning && <span className="wbc-over-msg">CG Outside Approved Limits</span>}
            {saveMsg && <span className="save-calc-msg">{saveMsg}</span>}
          </div>
          <button className="save-calc-btn" onClick={handleSaveCalc}>Save</button>
        </div>
      </div>
    </div>
    </div>
  );
}
