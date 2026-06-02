import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const SEAT_ROWS = [
  ['A', 'B', 'C', 'D'],
  ['E', 'F', 'G', 'H'],
  ['I', 'L', 'M', 'N'],
];

const ROW2_SEATS = new Set(['E', 'F', 'G', 'H']);

const CONFIG_OPTIONS = [
  'Cargo Hook',
  'Hoist',
  'Mission Console + FLIR',
  'Aerolite Stretcher',
];

const SEAT_DATA = {
  B: { weight_kg: 14.1, sta_arm_mm: 3415, bl_arm_mm: 254 },
  C: { weight_kg: 14.1, sta_arm_mm: 3415, bl_arm_mm: -254 },
  D: { weight_kg: 14.1, sta_arm_mm: 3415, bl_arm_mm: -737 },
  F: { weight_kg: 14.1, sta_arm_mm: 4789, bl_arm_mm: 254 },
  G: { weight_kg: 14.1, sta_arm_mm: 4789, bl_arm_mm: -254 },
  L: { weight_kg: 14.1, sta_arm_mm: 5600, bl_arm_mm: 254 },
  M: { weight_kg: 14.1, sta_arm_mm: 5600, bl_arm_mm: -254 },
  N: { weight_kg: 14.1, sta_arm_mm: 5600, bl_arm_mm: -737 },
};

const MISSING_SEAT_DEFAULTS = {
  A: { sta_arm_mm: 3415, bl_arm_mm: 737 },
  E: { sta_arm_mm: 4789, bl_arm_mm: 737 },
  H: { sta_arm_mm: 4789, bl_arm_mm: -737 },
  I: { sta_arm_mm: 5600, bl_arm_mm: 737 },
};

const EQUIP_DATA = {
  'Cargo Hook': { weight_kg: 21.1, sta_arm_mm: 5300, bl_arm_mm: 0 },
  'Hoist': { weight_kg: 72.17, sta_arm_mm: 4360, bl_arm_mm: 0 },
  'Mission Console + FLIR': { weight_kg: 85.0, sta_arm_mm: 2850, bl_arm_mm: -635 },
  'Aerolite Stretcher': { weight_kg: 95.6, sta_arm_mm: 4508, bl_arm_mm: 0 },
};

const BASE_EMPTY = { weight_kg: 4675.38, longMoment_kgmm: 25138328.12, latMoment_kgmm: -14480.0 };

const CFG_KEY_PREFIX = 'aw139_maintcfg_';

function loadConfig(reg) {
  try {
    const raw = localStorage.getItem(CFG_KEY_PREFIX + reg);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveConfig(reg, data) {
  localStorage.setItem(CFG_KEY_PREFIX + reg, JSON.stringify(data));
}

function loadRecords(reg) {
  try {
    const raw = localStorage.getItem('aw139_maint_' + reg);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveRecords(reg, data) {
  localStorage.setItem('aw139_maint_' + reg, JSON.stringify(data));
}

function getSeatData(seat) {
  if (SEAT_DATA[seat]) return SEAT_DATA[seat];
  const def = MISSING_SEAT_DEFAULTS[seat];
  if (def) return { weight_kg: 14.1, sta_arm_mm: def.sta_arm_mm, bl_arm_mm: def.bl_arm_mm };
  return null;
}

export default function MaintenanceConfig({ registration }) {
  const { session } = useAuth();

  const [installedSeats, setInstalledSeats] = useState(new Set());
  const [installedEquip, setInstalledEquip] = useState(new Set());
  const [autoRemoved, setAutoRemoved] = useState(new Set());
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const cfg = loadConfig(registration);
    if (cfg) {
      setInstalledSeats(new Set(cfg.seats));
      setInstalledEquip(new Set(cfg.equipment));
    } else {
      const allSeats = SEAT_ROWS.flat();
      setInstalledSeats(new Set(allSeats));
    }
    setLoaded(true);
  }, [registration]);

  const toggleSeat = useCallback((seat) => {
    if (autoRemoved.has(seat)) return;
    setInstalledSeats((prev) => {
      const next = new Set(prev);
      if (next.has(seat)) next.delete(seat);
      else next.add(seat);
      return next;
    });
    setSaved(false);
  }, [autoRemoved]);

  const toggleEquip = useCallback((option) => {
    if (option === 'Aerolite Stretcher') {
      setInstalledEquip((prev) => {
        const next = new Set(prev);
        const willInstall = !next.has(option);
        if (willInstall) {
          next.add(option);
          ROW2_SEATS.forEach((s) => setInstalledSeats((r) => { const n = new Set(r); n.delete(s); return n; }));
          setAutoRemoved(new Set(ROW2_SEATS));
        } else {
          next.delete(option);
          ROW2_SEATS.forEach((s) => setInstalledSeats((r) => { const n = new Set(r); n.add(s); return n; }));
          setAutoRemoved(new Set());
        }
        return next;
      });
    } else {
      setInstalledEquip((prev) => {
        const next = new Set(prev);
        if (next.has(option)) next.delete(option);
        else next.add(option);
        return next;
      });
    }
    setSaved(false);
  }, []);

  const totals = useMemo(() => {
    let w = BASE_EMPTY.weight_kg;
    let lm = BASE_EMPTY.longMoment_kgmm;
    let la = BASE_EMPTY.latMoment_kgmm;

    SEAT_ROWS.flat().forEach((seat) => {
      const d = getSeatData(seat);
      if (d) {
        if (!installedSeats.has(seat)) {
          w -= d.weight_kg;
          lm -= d.weight_kg * d.sta_arm_mm;
          la -= d.weight_kg * d.bl_arm_mm;
        }
      }
    });

    CONFIG_OPTIONS.forEach((opt) => {
      if (installedEquip.has(opt)) {
        const d = EQUIP_DATA[opt];
        w += d.weight_kg;
        lm += d.weight_kg * d.sta_arm_mm;
        la += d.weight_kg * d.bl_arm_mm;
      }
    });

    return {
      weight_kg: Math.round(w * 100) / 100,
      staCg_mm: w > 0 ? Math.round((lm / w) * 100) / 100 : 0,
      longMoment_kgmm: Math.round(lm * 100) / 100,
      blCg_mm: w > 0 ? Math.round((la / w) * 100) / 100 : 0,
      latMoment_kgmm: Math.round(la * 100) / 100,
    };
  }, [installedSeats, installedEquip]);

  const handleSave = () => {
    const prevCfg = loadConfig(registration);
    const prevSeats = prevCfg ? new Set(prevCfg.seats) : new Set(SEAT_ROWS.flat());
    const prevEquip = prevCfg ? new Set(prevCfg.equipment) : new Set();

    const today = new Date().toISOString().slice(0, 10);
    const username = session.username;
    const newRecords = [];

    let runningW = BASE_EMPTY.weight_kg;
    let runningLM = BASE_EMPTY.longMoment_kgmm;
    let runningLA = BASE_EMPTY.latMoment_kgmm;

    const allSeats = SEAT_ROWS.flat();
    allSeats.forEach((seat) => {
      const d = getSeatData(seat);
      if (d && !prevSeats.has(seat)) {
        runningW -= d.weight_kg;
        runningLM -= d.weight_kg * d.sta_arm_mm;
        runningLA -= d.weight_kg * d.bl_arm_mm;
      }
    });
    CONFIG_OPTIONS.forEach((opt) => {
      if (prevEquip.has(opt)) {
        const d = EQUIP_DATA[opt];
        runningW += d.weight_kg;
        runningLM += d.weight_kg * d.sta_arm_mm;
        runningLA += d.weight_kg * d.bl_arm_mm;
      }
    });

    const deltas = [];

    allSeats.forEach((seat) => {
      const was = prevSeats.has(seat);
      const now = installedSeats.has(seat);
      if (was && !now) {
        const d = getSeatData(seat);
        if (d) {
          deltas.push({
            action: 'OUT',
            denomination: `REMOVED SEAT (${seat})`,
            weightChange_kg: -d.weight_kg,
            staCg_mm: d.sta_arm_mm,
            longMoment_kgmm: -(d.weight_kg * d.sta_arm_mm),
            blCg_mm: d.bl_arm_mm,
            latMoment_kgmm: -(d.weight_kg * d.bl_arm_mm),
          });
        }
      }
      if (!was && now) {
        const d = getSeatData(seat);
        if (d) {
          deltas.push({
            action: 'IN',
            denomination: `INSTALLED SEAT (${seat})`,
            weightChange_kg: d.weight_kg,
            staCg_mm: d.sta_arm_mm,
            longMoment_kgmm: d.weight_kg * d.sta_arm_mm,
            blCg_mm: d.bl_arm_mm,
            latMoment_kgmm: d.weight_kg * d.bl_arm_mm,
          });
        }
      }
    });

    CONFIG_OPTIONS.forEach((opt) => {
      const was = prevEquip.has(opt);
      const now = installedEquip.has(opt);
      if (was && !now) {
        const d = EQUIP_DATA[opt];
        deltas.push({
          action: 'OUT',
          denomination: `REMOVED ${opt}`,
          weightChange_kg: -d.weight_kg,
          staCg_mm: d.sta_arm_mm,
          longMoment_kgmm: -(d.weight_kg * d.sta_arm_mm),
          blCg_mm: d.bl_arm_mm,
          latMoment_kgmm: -(d.weight_kg * d.bl_arm_mm),
        });
      }
      if (!was && now) {
        const d = EQUIP_DATA[opt];
        deltas.push({
          action: 'IN',
          denomination: `INSTALLED ${opt}`,
          weightChange_kg: d.weight_kg,
          staCg_mm: d.sta_arm_mm,
          longMoment_kgmm: d.weight_kg * d.sta_arm_mm,
          blCg_mm: d.bl_arm_mm,
          latMoment_kgmm: d.weight_kg * d.bl_arm_mm,
        });
      }
    });

    deltas.forEach((delta) => {
      runningW += delta.weightChange_kg;
      runningLM += delta.longMoment_kgmm;
      runningLA += delta.latMoment_kgmm;

      newRecords.push({
        date: today,
        action: delta.action,
        denomination: delta.denomination,
        weightChange_kg: Math.round(delta.weightChange_kg * 100) / 100,
        staCg_mm: delta.staCg_mm,
        longMoment_kgmm: Math.round(delta.longMoment_kgmm * 100) / 100,
        blCg_mm: delta.blCg_mm,
        latMoment_kgmm: Math.round(delta.latMoment_kgmm * 100) / 100,
        totalWeight_kg: Math.round(runningW * 100) / 100,
        totalLongMoment_kgmm: Math.round(runningLM * 100) / 100,
        totalStaCg_mm: Math.round((runningLM / runningW) * 100) / 100,
        totalLatMoment_kgmm: Math.round(runningLA * 100) / 100,
        totalBlCg_mm: Math.round((runningLA / runningW) * 100) / 100,
        signature: username,
      });
    });

    if (newRecords.length > 0) {
      const existing = loadRecords(registration) || [];
      saveRecords(registration, [...existing, ...newRecords]);
    }

    saveConfig(registration, {
      seats: [...installedSeats],
      equipment: [...installedEquip],
    });
    setSaved(true);
  };

  const seatClass = (seat) => {
    const classes = ['seat'];
    if (!installedSeats.has(seat)) classes.push('removed');
    if (autoRemoved.has(seat)) classes.push('disabled');
    return classes.join(' ');
  };

  if (!loaded) return null;

  return (
    <div className="config-page">
      <div className="config-layout">
        <div className="cabin-diagram">
          <div className="cabin-label">{registration} — Seating Configuration</div>
          <div className="cabin-body">
            <div className="cockpit">
              <div className="cockpit-label">Cockpit</div>
              <div className="cockpit-seats">
                <div className="seat crew"><span className="seat-label">Copilot</span></div>
                <div className="cockpit-divider" />
                <div className="seat crew"><span className="seat-label">Pilot</span></div>
              </div>
            </div>

            <div className="section-divider" />

            <div className="cabin-section">
              <div className="cabin-section-label">Cabin</div>
              <div className="cabin-seats">
                {SEAT_ROWS.map((row, ri) => (
                  <div key={ri} className="seat-row">
                    <div className="seat-side">
                      {row.slice(2).reverse().map((seat) => (
                        <button key={seat} className={seatClass(seat)} onClick={() => toggleSeat(seat)}>
                          <span className="seat-label">{seat}</span>
                        </button>
                      ))}
                    </div>
                    <div className="aisle" />
                    <div className="seat-side">
                      {row.slice(0, 2).reverse().map((seat) => (
                        <button key={seat} className={seatClass(seat)} onClick={() => toggleSeat(seat)}>
                          <span className="seat-label">{seat}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="config-panel">
          <h3>Equipment</h3>
          {CONFIG_OPTIONS.map((opt) => (
            <label key={opt} className="toggle-switch" onClick={() => toggleEquip(opt)}>
              <span className={`toggle-track ${installedEquip.has(opt) ? 'on' : ''}`}>
                <span className="toggle-thumb" />
              </span>
              <span className="toggle-label">{opt}</span>
            </label>
          ))}

          <div className="maint-cg-summary">
            <h3>Weight & CG</h3>
            <div className="maint-cg-row">
              <span>Current Weight</span>
              <span className="num highlight">{totals.weight_kg} kg</span>
            </div>
            <div className="maint-cg-row">
              <span>STA CG</span>
              <span className="num">{totals.staCg_mm} mm</span>
            </div>
            <div className="maint-cg-row">
              <span>BL CG</span>
              <span className="num">{totals.blCg_mm} mm</span>
            </div>
            <div className="maint-cg-row">
              <span>Long Moment</span>
              <span className="num">{totals.longMoment_kgmm}</span>
            </div>
            <div className="maint-cg-row">
              <span>Lat Moment</span>
              <span className="num">{totals.latMoment_kgmm}</span>
            </div>
          </div>

          <button className="maint-save-btn" onClick={handleSave}>
            {saved ? 'Saved ✓' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
