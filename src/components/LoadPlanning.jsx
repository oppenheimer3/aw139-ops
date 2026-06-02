import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import WeightBalanceCalc from './WeightBalanceCalc';

const SEAT_ROWS = [
  ['A', 'B', 'C', 'D'],
  ['E', 'F', 'G', 'H'],
  ['I', 'L', 'M', 'N'],
];

const ROW_DATA = {
  row1: { label: 'Row 1 (A, B, C, D)', armLong: 3415, seats: ['A', 'B', 'C', 'D'] },
  row2: { label: 'Row 2 (E, F, G, H)', armLong: 4789, seats: ['E', 'F', 'G', 'H'] },
  row3: { label: 'Row 3 (I, L, M, N)', armLong: 5600, seats: ['I', 'L', 'M', 'N'] },
};

const SEAT_LAT_ARM = {
  A: 737, B: 254, C: -254, D: -737,
  E: 737, F: 254, G: -254, H: -737,
  I: 737, L: 254, M: -254, N: -737,
};

const STRETCHERS = [
  { id: 'cirrus', label: 'Stretcher Cirrus 1850-450', armLong: 4250, armLat: 0 },
  { id: 'ab139_2nd', label: 'Stretcher AB139 (2nd)', armLong: 4741, armLat: 0 },
  { id: 'ab139_3rd', label: 'Stretcher AB139 (3rd)', armLong: 4804, armLat: 0 },
];

const BAGGAGE_COMPARTMENTS = ['FWD', 'MDL', 'AFT'];
const BAGGAGE_ARMS = { FWD: 7200, MDL: 7700, AFT: 8200 };

const CFG_KEY_PREFIX = 'aw139_maintcfg_';

function loadConfig(reg) {
  try {
    const raw = localStorage.getItem(CFG_KEY_PREFIX + reg);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function buildSeatWeightDefaults(seats) {
  const obj = {};
  seats.forEach((s) => { obj[s] = 0; });
  return obj;
}

export default function LoadPlanning({ registration, setBackOverride }) {
  const { session } = useAuth();
  const [showCalc, setShowCalc] = useState(false);
  const [installedSeats, setInstalledSeats] = useState(new Set());
  const [installedEquip, setInstalledEquip] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  const allSeats = SEAT_ROWS.flat();

  const [passengerWeights, setPassengerWeights] = useState(() => buildSeatWeightDefaults(allSeats));
  const [stretcherWeights, setStretcherWeights] = useState({ cirrus: 0, ab139_2nd: 0, ab139_3rd: 0 });
  const [baggage, setBaggage] = useState({ FWD: 0, MDL: 0, AFT: 0 });
  const [mainFuel, setMainFuel] = useState(1254);
  const [auxFuel, setAuxFuel] = useState(0);
  const [missionType, setMissionType] = useState('Passenger Transport');

  useEffect(() => {
    const cfg = loadConfig(registration);
    if (cfg) {
      setInstalledSeats(new Set(cfg.seats));
      setInstalledEquip(new Set(cfg.equipment));
    } else {
      setInstalledSeats(new Set(allSeats));
      setInstalledEquip(new Set());
    }
    setLoaded(true);
  }, [registration]);

  const stretcherKitInstalled = installedEquip.has('Aerolite Stretcher');

  const payload = useMemo(() => {
    let totalMass = 0;
    let totalLongMoment = 0;
    let totalLatMoment = 0;

    allSeats.forEach((seat) => {
      if (installedSeats.has(seat)) {
        const w = parseFloat(passengerWeights[seat]) || 0;
        totalMass += w;
        totalLongMoment += w * ROW_DATA[rowKey(seat)].armLong;
        totalLatMoment += w * (SEAT_LAT_ARM[seat] || 0);
      }
    });

    if (stretcherKitInstalled) {
      STRETCHERS.forEach((s) => {
        const w = parseFloat(stretcherWeights[s.id]) || 0;
        totalMass += w;
        totalLongMoment += w * s.armLong;
        totalLatMoment += w * s.armLat;
      });
    }

    ['FWD', 'MDL', 'AFT'].forEach((comp) => {
      const w = parseFloat(baggage[comp]) || 0;
      totalMass += w;
      totalLongMoment += w * BAGGAGE_ARMS[comp];
    });

    const cg = totalMass > 0 ? totalLongMoment / totalMass : 0;
    const latCg = totalMass > 0 ? totalLatMoment / totalMass : 0;

    return {
      totalMass: Math.round(totalMass * 100) / 100,
      cg: Math.round(cg * 10) / 10,
      latCg: Math.round(latCg * 10) / 10,
      longMoment: Math.round(totalLongMoment * 100) / 100,
      latMoment: Math.round(totalLatMoment * 100) / 100,
    };
  }, [installedSeats, passengerWeights, stretcherWeights, baggage, stretcherKitInstalled]);

  const handleWeightChange = (seat, value) => {
    setPassengerWeights({ ...passengerWeights, [seat]: value });
  };

  useEffect(() => {
    if (setBackOverride && !showCalc) {
      setBackOverride(null);
    }
  }, [showCalc, setBackOverride]);

  if (!loaded) return null;

  if (showCalc) {
    return (
      <div className="config-page">
        <div style={{ padding: '24px 32px 0' }}>
          <button className="back-btn" onClick={() => setShowCalc(false)}>← Back to input</button>
        </div>
        <WeightBalanceCalc
          registration={registration}
          payloadMass={payload.totalMass}
          payloadMoment={payload.longMoment}
          payloadLatMoment={payload.latMoment}
          mainFuel={mainFuel}
          auxFuel={auxFuel}
          missionType={missionType}
          username={session.username}
        />
      </div>
    );
  }

  return (
    <div className="config-page">
      <div className="config-layout">
        <div className="cabin-diagram">
          <div className="cabin-label">{registration} — Passenger Load</div>
          <div className="cabin-sections">

            <div className="cabin-block">
              <div className="cockpit">
                <div className="cockpit-label">Cockpit</div>
                <div className="cockpit-seats">
                  <div className="seat crew"><span className="seat-label">Copilot (80kg)</span></div>
                  <div className="cockpit-divider" />
                  <div className="seat crew"><span className="seat-label">Pilot (80kg)</span></div>
                </div>
              </div>
            </div>

            <div className="section-divider" />

            <div className="cabin-block">
              <div className="cabin-section">
                <div className="cabin-section-label">Cabin</div>
                <div className="cabin-seats">
                  {SEAT_ROWS.map((row, ri) => (
                    <div key={ri} className="seat-row">
                      <div className="seat-side">
                        {row.slice(2).reverse().map((seat) => (
                          <div
                            key={seat}
                            className={`seat-wrapper ${!installedSeats.has(seat) ? 'disabled' : ''}`}
                          >
                            <span className="seat-wrapper-label">{seat}</span>
                            <div className="seat-wrapper-field">
                              <input
                                type="number" min="0"
                                className="seat-weight-input"
                                disabled={!installedSeats.has(seat)}
                                value={installedSeats.has(seat) ? passengerWeights[seat] : 0}
                                onChange={(e) => handleWeightChange(seat, e.target.value)}
                              />
                              <span className="baggage-unit">kg</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="aisle" />
                      <div className="seat-side">
                        {row.slice(0, 2).reverse().map((seat) => (
                          <div
                            key={seat}
                            className={`seat-wrapper ${!installedSeats.has(seat) ? 'disabled' : ''}`}
                          >
                            <span className="seat-wrapper-label">{seat}</span>
                            <div className="seat-wrapper-field">
                              <input
                                type="number" min="0"
                                className="seat-weight-input"
                                disabled={!installedSeats.has(seat)}
                                value={installedSeats.has(seat) ? passengerWeights[seat] : 0}
                                onChange={(e) => handleWeightChange(seat, e.target.value)}
                              />
                              <span className="baggage-unit">kg</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="section-divider" />

            <div className="cabin-block">
              <div className="baggage">
                <div className="baggage-label">Baggage Compartment</div>
                <div className="baggage-inputs">
                  {BAGGAGE_COMPARTMENTS.map((comp) => (
                    <label key={comp} className="baggage-item">
                      <span className="baggage-name">{comp}</span>
                      <div className="baggage-field">
                        <input
                          type="number" min="0"
                          className="baggage-kg"
                          value={baggage[comp]}
                          onChange={(e) => setBaggage({ ...baggage, [comp]: e.target.value })}
                        />
                        <span className="baggage-unit">kg</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="right-col">
          <div className="config-panel">
            <h3>Mission Type</h3>
            <select className="mission-select"
              value={missionType}
              onChange={(e) => setMissionType(e.target.value)}
            >
              <option value="Medical Evacuation (MEDEVAC)">Medical Evacuation (MEDEVAC)</option>
              <option value="Firefighting">Firefighting</option>
              <option value="Search and Rescue (SAR)">Search and Rescue (SAR)</option>
              <option value="VIP Transport">VIP Transport</option>
              <option value="Passenger Transport">Passenger Transport</option>
              <option value="Cargo Transport">Cargo Transport</option>
            </select>

            <h3>Stretchers</h3>
            {STRETCHERS.map((s) => (
              <label key={s.id} className={`load-seat stretcher ${!stretcherKitInstalled ? 'disabled' : ''}`}>
                <span className="load-seat-label">{s.id === 'cirrus' ? <>Stretcher Cirrus 1850-<br />450</> : s.label}</span>
                <div className="stretcher-field">
                  <input
                    type="number" min="0"
                    disabled={!stretcherKitInstalled}
                    value={stretcherKitInstalled ? stretcherWeights[s.id] : 0}
                    onChange={(e) => setStretcherWeights({ ...stretcherWeights, [s.id]: e.target.value })}
                  />
                  <span className="baggage-unit">kg</span>
                </div>
              </label>
            ))}
            {!stretcherKitInstalled && (
              <div className="load-note">Stretchers require Aerolite Stretcher kit installed</div>
            )}

            <div className="load-payload">
              <h3>Payload</h3>
              <div className="maint-cg-row">
                <span>Payload Mass</span>
                <span className="num highlight">{payload.totalMass} kg</span>
              </div>
            </div>

            <div className="load-fuel">
              <h3>Fuel</h3>
              <label className="load-fuel-row">
                <span>Main Tank</span>
                <input type="number" min="0" step="any" value={mainFuel}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (v !== '' && parseFloat(v) > 1254) v = '1254';
                    setMainFuel(v);
                  }}
                />
                <span className="baggage-unit">kg</span>
              </label>
              <label className="load-fuel-row">
                <span>Aux Tank</span>
                <input type="number" min="0" step="any" value={auxFuel}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (v !== '' && parseFloat(v) > 400) v = '400';
                    setAuxFuel(v);
                  }}
                />
                <span className="baggage-unit">kg</span>
              </label>
            </div>

        </div>

          <button className="calc-btn" onClick={() => {
            if (setBackOverride) setBackOverride(() => () => setShowCalc(false));
            setShowCalc(true);
          }}>Calculate</button>
        </div>
      </div>
    </div>
  );
}

function rowKey(seat) {
  if (['A', 'B', 'C', 'D'].includes(seat)) return 'row1';
  if (['E', 'F', 'G', 'H'].includes(seat)) return 'row2';
  return 'row3';
}
