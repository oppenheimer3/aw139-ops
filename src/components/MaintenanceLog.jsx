import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SEED_DATA = [
  { date: '2025-06-19', action: 'IN', denomination: 'EMPTY WEIGHT', weightChange_kg: 0.0, staCg_mm: 0.0, longMoment_kgmm: 0.0, blCg_mm: 0.0, latMoment_kgmm: 0.0, totalWeight_kg: 4675.38, totalLongMoment_kgmm: 25138328.12, totalStaCg_mm: 5376.75, totalLatMoment_kgmm: -14480.0, totalBlCg_mm: -3.1, signature: 'GAPC001' },
  { date: '2025-07-02', action: 'OUT', denomination: 'REMOVED KIT SX16 STREEABLE  LANDING LIGHT IR NVG', weightChange_kg: -37.68, staCg_mm: 3634.0, longMoment_kgmm: -136929.12, blCg_mm: 0.0, latMoment_kgmm: 0.0, totalWeight_kg: 4637.7, totalLongMoment_kgmm: 25001399.0, totalStaCg_mm: 5390.9, totalLatMoment_kgmm: -14480.0, totalBlCg_mm: -3.12, signature: 'GAPC001' },
  { date: '2025-09-15', action: 'OUT', denomination: 'REMOVED KIT HOIST BREEZE EXTENDED CABLE LENGTH', weightChange_kg: -89.94, staCg_mm: 4194.0, longMoment_kgmm: -377208.36, blCg_mm: 950.0, latMoment_kgmm: -85443.0, totalWeight_kg: 4547.76, totalLongMoment_kgmm: 24624190.64, totalStaCg_mm: 5414.58, totalLatMoment_kgmm: 70963.0, totalBlCg_mm: 15.6, signature: 'OPS"B"' },
  { date: '2025-09-28', action: 'IN', denomination: 'INSTALLED MIDDDLE ROW SEAT (F)', weightChange_kg: 14.1, staCg_mm: 4789.0, longMoment_kgmm: 67524.9, blCg_mm: 254.0, latMoment_kgmm: 3581.4, totalWeight_kg: 4561.86, totalLongMoment_kgmm: 24691715.54, totalStaCg_mm: 5412.64, totalLatMoment_kgmm: 74544.4, totalBlCg_mm: 16.34, signature: 'OPS"B"' },
  { date: '2025-09-28', action: 'IN', denomination: 'INSTALLED MIDDDLE ROW SEAT (G)', weightChange_kg: 14.1, staCg_mm: 4789.0, longMoment_kgmm: 67524.9, blCg_mm: -254.0, latMoment_kgmm: -3581.4, totalWeight_kg: 4491.36, totalLongMoment_kgmm: 24871420.04, totalStaCg_mm: 5537.61, totalLatMoment_kgmm: -99923.0, totalBlCg_mm: -22.25, signature: 'OPS"B"' },
  { date: '2025-11-10', action: 'OUT', denomination: 'REMOVED MIDDDLE ROW SEAT (F)', weightChange_kg: -14.1, staCg_mm: 4789.0, longMoment_kgmm: 67524.9, blCg_mm: 254.0, latMoment_kgmm: -3581.4, totalWeight_kg: 4477.26, totalLongMoment_kgmm: 24938944.94, totalStaCg_mm: 5570.14, totalLatMoment_kgmm: -103504.4, totalBlCg_mm: -23.12, signature: 'OPS"C"' },
  { date: '2025-11-10', action: 'OUT', denomination: 'REMOVED MIDDDLE ROW SEAT (G)', weightChange_kg: -14.1, staCg_mm: 4789.0, longMoment_kgmm: 67524.9, blCg_mm: -254.0, latMoment_kgmm: -3581.4, totalWeight_kg: 4491.36, totalLongMoment_kgmm: 24778079.74, totalStaCg_mm: 5516.85, totalLatMoment_kgmm: -110667.2, totalBlCg_mm: -24.64, signature: 'OPS"C"' },
  { date: '2025-12-02', action: 'IN', denomination: 'INSTALLED KIT CARGO HOOK', weightChange_kg: 21.1, staCg_mm: 5300.0, longMoment_kgmm: 111830.0, blCg_mm: 0.0, latMoment_kgmm: 0.0, totalWeight_kg: 4512.46, totalLongMoment_kgmm: 24889909.74, totalStaCg_mm: 5515.82, totalLatMoment_kgmm: -110667.2, totalBlCg_mm: -24.52, signature: 'OPS"B"' },
  { date: '2025-12-02', action: 'OUT', denomination: 'REMOVED KIT CARGO HOOK', weightChange_kg: -21.1, staCg_mm: 5300.0, longMoment_kgmm: -111830.0, blCg_mm: 0.0, latMoment_kgmm: 0.0, totalWeight_kg: 4470.26, totalLongMoment_kgmm: 24666249.74, totalStaCg_mm: 5517.86, totalLatMoment_kgmm: -110667.2, totalBlCg_mm: -24.76, signature: 'OPS"B"' },
  { date: '2026-01-23', action: 'OUT', denomination: 'REMOVED MIDDDLE ROW SEAT (F)', weightChange_kg: -14.1, staCg_mm: 4789.0, longMoment_kgmm: -67524.9, blCg_mm: 254.0, latMoment_kgmm: -3581.4, totalWeight_kg: 4456.16, totalLongMoment_kgmm: 24598724.84, totalStaCg_mm: 5520.16, totalLatMoment_kgmm: -114248.6, totalBlCg_mm: -25.64, signature: 'OPS"B"' },
  { date: '2026-01-23', action: 'OUT', denomination: 'REMOVED MIDDDLE ROW SEAT (G)', weightChange_kg: -14.1, staCg_mm: 4789.0, longMoment_kgmm: -67524.9, blCg_mm: -254.0, latMoment_kgmm: 3581.4, totalWeight_kg: 4442.06, totalLongMoment_kgmm: 24643029.94, totalStaCg_mm: 5547.66, totalLatMoment_kgmm: -110667.2, totalBlCg_mm: -24.91, signature: 'OPS"B"' },
  { date: '2026-01-23', action: 'IN', denomination: 'INSTALLED STRETCHER KIT AEROLITE', weightChange_kg: 95.6, staCg_mm: 4508.0, longMoment_kgmm: 430964.8, blCg_mm: 0.0, latMoment_kgmm: 0.0, totalWeight_kg: 4537.66, totalLongMoment_kgmm: 25073994.74, totalStaCg_mm: 5525.75, totalLatMoment_kgmm: -110667.2, totalBlCg_mm: -24.39, signature: 'OPS"B"' },
];

const FIELDS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'action', label: 'Action', type: 'select', options: ['IN', 'OUT'] },
  { key: 'denomination', label: 'Denomination', type: 'text' },
  { key: 'weightChange_kg', label: 'Wt Chg (kg)', type: 'number' },
  { key: 'staCg_mm', label: 'STA CG (mm)', type: 'number' },
  { key: 'longMoment_kgmm', label: 'Long Mom (kgmm)', type: 'number' },
  { key: 'blCg_mm', label: 'BL CG (mm)', type: 'number' },
  { key: 'latMoment_kgmm', label: 'Lat Mom (kgmm)', type: 'number' },
  { key: 'totalWeight_kg', label: 'Total Wt (kg)', type: 'number' },
  { key: 'totalLongMoment_kgmm', label: 'Total Long Mom (kgmm)', type: 'number' },
  { key: 'totalStaCg_mm', label: 'Total STA CG (mm)', type: 'number' },
  { key: 'totalLatMoment_kgmm', label: 'Total Lat Mom (kgmm)', type: 'number' },
  { key: 'totalBlCg_mm', label: 'Total BL CG (mm)', type: 'number' },
  { key: 'signature', label: 'Signature', type: 'text' },
];

const STORAGE_PREFIX = 'aw139_maint_';

function loadData(reg) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + reg);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveData(reg, data) {
  localStorage.setItem(STORAGE_PREFIX + reg, JSON.stringify(data));
}

function emptyRow(username) {
  return {
    date: new Date().toISOString().slice(0, 10),
    action: 'IN',
    denomination: '',
    weightChange_kg: 0,
    staCg_mm: 0,
    longMoment_kgmm: 0,
    blCg_mm: 0,
    latMoment_kgmm: 0,
    totalWeight_kg: 0,
    totalLongMoment_kgmm: 0,
    totalStaCg_mm: 0,
    totalLatMoment_kgmm: 0,
    totalBlCg_mm: 0,
    signature: username,
  };
}

export default function MaintenanceLog({ registration, readOnly }) {
  const { session } = useAuth();
  const [records, setRecords] = useState(() => {
    const stored = loadData(registration);
    return stored || SEED_DATA.map((r) => ({ ...r }));
  });
  const [editingIdx, setEditingIdx] = useState(null);
  const [form, setForm] = useState(emptyRow(session.username));
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loadData(registration)) {
      saveData(registration, records);
    }
  }, []);

  const handleSave = () => {
    if (editingIdx !== null) {
      const next = [...records];
      next[editingIdx] = { ...form };
      setRecords(next);
      saveData(registration, next);
      setEditingIdx(null);
    } else {
      const next = [...records, { ...form }];
      setRecords(next);
      saveData(registration, next);
    }
    setForm(emptyRow(session.username));
    setShowForm(false);
  };

  const handleEdit = (idx) => {
    setForm({ ...records[idx] });
    setEditingIdx(idx);
    setShowForm(true);
  };

  const handleDelete = (idx) => {
    const next = records.filter((_, i) => i !== idx);
    setRecords(next);
    saveData(registration, next);
  };

  const handleCancel = () => {
    setForm(emptyRow(session.username));
    setEditingIdx(null);
    setShowForm(false);
  };

  return (
    <div className="maint-page">
      <div className="maint-header">
        <h2>Weight & Balance Log — {registration}</h2>
        {!readOnly && !showForm && (
          <button className="add-btn" onClick={() => setShowForm(true)}>+ Add Record</button>
        )}
      </div>

      {!readOnly && showForm && (
        <div className="maint-form-overlay">
          <div className="maint-form">
            <h3>{editingIdx !== null ? 'Edit Record' : 'New Record'}</h3>
            <div className="maint-form-grid">
              {FIELDS.map((f) => (
                <label key={f.key} className="maint-field">
                  <span className="maint-field-label">{f.label}</span>
                  {f.type === 'select' ? (
                    <select
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    >
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      step={f.type === 'number' ? 'any' : undefined}
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
                      readOnly={f.key === 'signature'}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="maint-form-actions">
              <button className="add-btn" onClick={handleSave}>
                {editingIdx !== null ? 'Update' : 'Save'}
              </button>
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="maint-table-wrap">
        <table className="maint-table">
          <thead>
            <tr>
              {FIELDS.filter((f) => f.key !== 'action').map((f) => <th key={f.key}>{f.label}</th>)}
              {!readOnly && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {records.map((rec, i) => (
              <tr key={i} className={rec.action === 'IN' ? 'row-in' : rec.action === 'OUT' ? 'row-out' : ''}>
                {FIELDS.filter((f) => f.key !== 'action').map((f) => {
                  const cls = f.type === 'number' ? 'num' : '';
                  return <td key={f.key} className={cls}>{rec[f.key]}</td>;
                })}
                {!readOnly && (
                  <td className="maint-actions">
                    <button className="edit-btn" onClick={() => handleEdit(i)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(i)}>Del</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
