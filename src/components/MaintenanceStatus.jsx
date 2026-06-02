import { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
  { value: 'ready', label: 'Ready for Flight', icon: '🟢' },
  { value: 'line', label: 'Line Maintenance', icon: '🟡' },
  { value: 'inspection', label: 'Scheduled Inspection', icon: '🔴' },
  { value: 'aog', label: 'AOG - Unscheduled Repair', icon: '🚨' },
];

const STORAGE_KEY = (reg) => 'aw139_maint_status_' + reg;

function loadStatus(reg) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(reg));
    return raw || 'ready';
  } catch {
    return 'ready';
  }
}

function saveStatus(reg, status) {
  localStorage.setItem(STORAGE_KEY(reg), status);
}

export default function MaintenanceStatus({ registration }) {
  const [status, setStatus] = useState(() => loadStatus(registration));
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setStatus(loadStatus(registration));
    setSaved(true);
  }, [registration]);

  const handleChange = (e) => {
    const val = e.target.value;
    setStatus(val);
    saveStatus(registration, val);
    setSaved(false);
    setTimeout(() => setSaved(true), 2000);
  };

  const opt = STATUS_OPTIONS.find((o) => o.value === status);

  return (
    <div className="maint-page maint-page--centered">
      <div className="maint-status-card">
        <h2 className="maint-status-heading">Maintenance Status — {registration}</h2>

        <div className="maint-status-current">
          <span className="maint-status-icon">{opt?.icon}</span>
          <span className={`maint-status-badge maint-status-badge--${status}`}>
            {opt?.label}
          </span>
        </div>

        <div className="maint-status-options">
          {STATUS_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`maint-status-option ${status === o.value ? 'maint-status-option--selected' : ''}`}
            >
              <input
                type="radio"
                name="maint-status"
                value={o.value}
                checked={status === o.value}
                onChange={handleChange}
              />
              <span className="maint-status-option-icon">{o.icon}</span>
              <span className="maint-status-option-label">{o.label}</span>
            </label>
          ))}
        </div>

        <div className="maint-status-desc">
          {status === 'ready' && 'Aircraft is airworthy and ready for operations. All Weight & Balance functions are available.'}
          {status === 'line' && 'Aircraft is undergoing routine line maintenance (pre-flight, daily, or 48-hour check). Short delay expected.'}
          {status === 'inspection' && 'Aircraft is grounded for a scheduled base inspection (300h/600h/1200h or annual check). Out of service for days/weeks.'}
          {status === 'aog' && 'Aircraft is grounded due to an unscheduled mechanical issue or pilot squawk. Must be repaired before next flight.'}
        </div>
      </div>
    </div>
  );
}
