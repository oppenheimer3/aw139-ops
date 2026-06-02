import { useState, useCallback, useMemo } from 'react';

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

const BAGGAGE_COMPARTMENTS = ['FWD', 'MDL', 'AFT'];

const BAGGAGE_DATA = {
  FWD: { label: 'Baggage FWD', armMm: 7200 },
  MDL: { label: 'Baggage MDL', armMm: 7700 },
  AFT: { label: 'Baggage AFT', armMm: 8200 },
};

const KIT_DATA = {
  'Cargo Hook': { massKg: 21.1, armMm: 5300 },
  'Hoist': { massKg: 72.17, armMm: 4360 },
  'Mission Console + FLIR': { massKg: 45.0, armMm: 3634 },
  'Aerolite Stretcher': { massKg: 95.6, armMm: 4508 },
};

const SEAT_ROW_DATA = [
  { seats: ['A', 'B', 'C', 'D'], massKg: 90, armMm: 3415, label: 'Row 1' },
  { seats: ['E', 'F', 'G', 'H'], massKg: 90, armMm: 4789, label: 'Row 2' },
  { seats: ['I', 'L', 'M', 'N'], massKg: 90, armMm: 5600, label: 'Row 3' },
];

const PAYLOAD_ITEMS = [
  { label: 'Pilot', count: 1, massEachKg: 80, armMm: 2820 },
  { label: 'Co-Pilot', count: 1, massEachKg: 80, armMm: 2820 },
];

export default function HelicopterConfig({ registration, hideBaggage }) {
  const [removed, setRemoved] = useState(new Set());
  const [autoRemoved, setAutoRemoved] = useState(new Set());
  const [selectedConfigs, setSelectedConfigs] = useState(new Set());
  const [baggage, setBaggage] = useState({ FWD: '', MDL: '', AFT: '' });

  const toggleSeat = useCallback((seat) => {
    if (autoRemoved.has(seat)) return;
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(seat)) next.delete(seat);
      else next.add(seat);
      return next;
    });
  }, [autoRemoved]);

  const toggleConfig = useCallback((option) => {
    if (option === 'Aerolite Stretcher') {
      setSelectedConfigs((prev) => {
        const next = new Set(prev);
        const willCheck = !next.has(option);
        if (willCheck) {
          next.add(option);
          ROW2_SEATS.forEach((s) => { setRemoved((r) => new Set(r).add(s)); });
          setAutoRemoved(new Set(ROW2_SEATS));
        } else {
          next.delete(option);
          setRemoved((r) => {
            const n = new Set(r);
            ROW2_SEATS.forEach((s) => n.delete(s));
            return n;
          });
          setAutoRemoved(new Set());
        }
        return next;
      });
    } else {
      setSelectedConfigs((prev) => {
        const next = new Set(prev);
        if (next.has(option)) next.delete(option);
        else next.add(option);
        return next;
      });
    }
  }, []);

  const seatClass = (seat) => {
    const classes = ['seat'];
    if (removed.has(seat)) classes.push('removed');
    if (autoRemoved.has(seat)) classes.push('disabled');
    return classes.join(' ');
  };

  const { items, totalMass, cg } = useMemo(() => {
    const result = [];

    PAYLOAD_ITEMS.forEach((p) => {
      result.push({
        label: p.label,
        massKg: p.massEachKg,
        armMm: p.armMm,
        moment: p.massEachKg * p.armMm,
      });
    });

    SEAT_ROW_DATA.forEach((row) => {
      const occupied = row.seats.filter((s) => !removed.has(s)).length;
      if (occupied > 0) {
        const mass = occupied * row.massKg;
        result.push({
          label: `${row.label} (${occupied} pax)`,
          massKg: mass,
          armMm: row.armMm,
          moment: mass * row.armMm,
        });
      }
    });

    CONFIG_OPTIONS.forEach((opt) => {
      if (selectedConfigs.has(opt)) {
        const k = KIT_DATA[opt];
        result.push({
          label: opt,
          massKg: k.massKg,
          armMm: k.armMm,
          moment: k.massKg * k.armMm,
        });
      }
    });

    if (!hideBaggage) {
      BAGGAGE_COMPARTMENTS.forEach((comp) => {
        const val = parseFloat(baggage[comp]);
        if (val > 0) {
          const b = BAGGAGE_DATA[comp];
          result.push({
            label: b.label,
            massKg: val,
            armMm: b.armMm,
            moment: val * b.armMm,
          });
        }
      });
    }

    const totalMass = result.reduce((s, i) => s + i.massKg, 0);
    const totalMoment = result.reduce((s, i) => s + i.moment, 0);
    const cg = totalMass > 0 ? totalMoment / totalMass : 0;

    return { items: result, totalMass: Math.round(totalMass * 100) / 100, cg: Math.round(cg * 10) / 10 };
  }, [removed, selectedConfigs, baggage]);

  return (
    <div className="config-page">
      <div className="config-layout">
        <div className="cabin-diagram">
          <div className="cabin-label">{registration} — {hideBaggage ? 'Seating' : 'Cabin'} Configuration</div>

          <div className="cockpit">
            <div className="cockpit-label">Cockpit</div>
            <div className="cockpit-seats">
              <div className="seat crew">
                <span className="seat-label">Copilot</span>
              </div>
              <div className="cockpit-divider" />
              <div className="seat crew">
                <span className="seat-label">Pilot</span>
              </div>
            </div>
          </div>

          <div className="cabin-section">
            <div className="cabin-section-label">Cabin</div>
            <div className="cabin-seats">
              {SEAT_ROWS.map((row, ri) => (
              <div key={ri} className="seat-row">
                <div className="seat-side">
                  {row.slice(2).reverse().map((seat) => (
                    <button
                      key={seat}
                      className={seatClass(seat)}
                      onClick={() => toggleSeat(seat)}
                    >
                      <span className="seat-label">{seat}</span>
                    </button>
                  ))}
                </div>
                <div className="aisle" />
                <div className="seat-side">
                  {row.slice(0, 2).reverse().map((seat) => (
                    <button
                      key={seat}
                      className={seatClass(seat)}
                      onClick={() => toggleSeat(seat)}
                    >
                      <span className="seat-label">{seat}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          </div>

          {!hideBaggage && (
            <div className="baggage">
              <div className="baggage-label">Baggage Compartment</div>
              <div className="baggage-inputs">
                {BAGGAGE_COMPARTMENTS.map((comp) => (
                  <label key={comp} className="baggage-item">
                    <span className="baggage-name">{comp}</span>
                    <div className="baggage-field">
                      <input
                        type="number"
                        min="0"
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
          )}
        </div>

        <div className="config-panel">
          <h3>Equipment Configurations</h3>
          {CONFIG_OPTIONS.map((opt) => (
            <label key={opt} className="config-checkbox">
              <input
                type="checkbox"
                checked={selectedConfigs.has(opt)}
                onChange={() => toggleConfig(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}

          <div className="payload-summary">
            <h3>Payload Summary</h3>
            <table className="payload-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Mass (kg)</th>
                  <th>Arm (mm)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.label}</td>
                    <td className="num">{item.massKg.toFixed(1)}</td>
                    <td className="num">{item.armMm}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total Mass</td>
                  <td className="num" colSpan="2">{totalMass.toFixed(1)} kg</td>
                </tr>
                <tr>
                  <td>CG</td>
                  <td className="num" colSpan="2">{cg.toFixed(1)} mm</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
