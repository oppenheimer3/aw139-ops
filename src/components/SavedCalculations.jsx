import { useState } from 'react';
import { CgChart } from './WeightBalanceCalc';

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

const fmt = (v) => {
  if (typeof v === 'number') return Math.round(v * 100) / 100;
  return v;
};

export default function SavedCalculations({ registration, autoSelectLast, hideBack }) {
  const [saved, setSaved] = useState(() => {
    try {
      const raw = localStorage.getItem('aw139_saved_calcs_' + registration);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [selectedIdx, setSelectedIdx] = useState(() => {
    if (autoSelectLast) {
      try {
        const raw = localStorage.getItem('aw139_saved_calcs_' + registration);
        if (raw) {
          const arr = JSON.parse(raw);
          return arr.length > 0 ? arr.length - 1 : null;
        }
      } catch {}
    }
    return null;
  });

  const handleDelete = (idx) => {
    const next = saved.filter((_, i) => i !== idx);
    setSaved(next);
    localStorage.setItem('aw139_saved_calcs_' + registration, JSON.stringify(next));
    if (selectedIdx === idx) setSelectedIdx(null);
    else if (selectedIdx !== null && selectedIdx > idx) setSelectedIdx(selectedIdx - 1);
  };

  if (saved.length === 0) {
    return (
      <div className="config-page">
        <div className="saved-page-content">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--cyan-300)', margin: 0 }}>Weight and Balance</h2>
          <p className="saved-empty">No saved calculations yet.</p>
        </div>
      </div>
    );
  }

  if (selectedIdx !== null) {
    const calc = saved[selectedIdx];

    return (
      <div className="config-page">
        <div className="saved-page-content">
          {!hideBack && <button className="back-btn" onClick={() => setSelectedIdx(null)} style={{ marginBottom: 16 }}>&larr; Back to list</button>}
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--cyan-300)', margin: '0 0 16px' }}>Weight and Balance</h2>

        <div className="saved-detail-meta">
          <span>Date: <strong>{calc.date}</strong></span>
          <span>User: <strong>{calc.username}</strong></span>
          <span>Mission: <strong>{calc.missionType}</strong></span>
          <span>TOM: <strong>{fmt(calc.tom)} kg</strong></span>
        </div>

        <div className="wbc-body">
          <div className="wbc-charts">
            <CgChart
              title="Longitudinal CG Envelope"
              points={[
                { label: 'BEM', x: calc.bem.staCg, y: calc.bem.weight_kg },
                { label: 'ZFM', x: calc.zfmCg, y: calc.zfm },
                { label: 'TOM', x: calc.toCg, y: calc.tom },
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
                { label: 'BEM', x: calc.bem.blCg, y: calc.bem.weight_kg },
                { label: 'ZFM', x: calc.zfmBl, y: calc.zfm },
                { label: 'TOM', x: calc.toBl, y: calc.tom },
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
                {calc.rows.map((r, i) => (
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
            <div className={`wbc-capacity ${calc.tom > 6400 || calc.cgWarning ? 'wbc-over' : ''}`}>
              <div className="wbc-capacity-left">
                <span>Remaining available Payload: {fmt(6400 - calc.tom)} kg</span>
                {calc.tom > 6400 && <span className="wbc-over-msg">Max gross weight exceeded!</span>}
                {calc.cgWarning && <span className="wbc-over-msg">CG Outside Approved Limits</span>}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="config-page">
      <div className="saved-page-content">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--cyan-300)', margin: '0 0 16px' }}>Weight and Balance</h2>
      <p className="saved-count">{saved.length} calculation{saved.length > 1 ? 's' : ''} saved</p>

      <table className="maint-table saved-summary-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Signature</th>
            <th>Mission Type</th>
            <th>TOM (kg)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {[...saved].reverse().map((calc, ri) => {
            const idx = saved.length - 1 - ri;
            return (
              <tr key={idx} className="saved-summary-row" onClick={() => setSelectedIdx(idx)}>
                <td>{calc.date}</td>
                <td>{calc.username}</td>
                <td>{calc.missionType}</td>
                <td className="num">{fmt(calc.tom)}</td>
                <td>
                  <button className="delete-btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}>&times;</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
        </div>
      </div>
    );
  }
