import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import OperationsView from './OperationsView';
import MaintenanceView from './MaintenanceView';

const FLEET = [
  { reg: '7T-VWD', msn: '31,400' },
  { reg: '7T-VWE', msn: '31,401' },
  { reg: '7T-VWF', msn: '31,402' },
  { reg: '7T-VWG', msn: '31,409' },
  { reg: '7T-VWH', msn: '31,410' },
  { reg: '7T-VWI', msn: '31,415' },
];

const STATUS_META = {
  ready: { label: 'Ready', cls: 'ready' },
  line: { label: 'Line Maint', cls: 'line' },
  inspection: { label: 'Scheduled Inspection', cls: 'inspection' },
  aog: { label: 'AOG - Repair', cls: 'aog' },
};

function getStatus(reg) {
  try {
    return localStorage.getItem('aw139_maint_status_' + reg) || 'ready';
  } catch {
    return 'ready';
  }
}

export default function UserDashboard() {
  const { session, logout } = useAuth();
  const [selectedHeli, setSelectedHeli] = useState(null);
  const [backOverride, setBackOverride] = useState(null);
  const [blockedHeli, setBlockedHeli] = useState(null);
  const [blockedStatus, setBlockedStatus] = useState(null);

  const isOps = session.role === 'Flight Operations';
  const isMaint = session.role === 'Maintenance';
  const isPilot = session.role === 'Pilot';
  const showDetail = selectedHeli && (isOps || isMaint || isPilot);
  const isNonOps = isPilot || isOps;

  const handleSelectHeli = (reg) => {
    const s = getStatus(reg);
    if (isNonOps && s !== 'ready') {
      setBlockedHeli(reg);
      setBlockedStatus(s);
      return;
    }
    setSelectedHeli(reg);
  };

  const handleBack = () => {
    if (backOverride) {
      backOverride();
    } else {
      setSelectedHeli(null);
    }
  };

  return (
    <div className="user-page">
      <div className="top-bar">
        <div className="top-bar-left">
          <img src="/GAPC.png" alt="GAPC" className="top-bar-logo" />
          <span className="top-bar-divider" />
          <span className="top-bar-title">Algerian Civil Protection Air Group</span>
        </div>
        <div className="top-bar-right">
          <div className="top-bar-user">
            <span className={`role-badge role-badge--${session.role === 'Pilot' ? 'pilot' : session.role === 'Maintenance' ? 'tech' : 'ops'}`}>
              <svg className="top-bar-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {session.role === 'Pilot' ? 'Pilot' : session.role === 'Maintenance' ? 'Tech' : 'Ops'}<span className="role-badge-user">: {session.username}</span>
            </span>
          </div>
          <span className="top-bar-divider-vertical" />
          <button className="logout-btn" onClick={logout}>
            <img src="/logout.png" alt="Logout" className="logout-icon" />
            <span className="logout-label">Logout</span>
          </button>
        </div>
      </div>

      {blockedHeli && (
        <div className="maint-form-overlay" onClick={() => { setBlockedHeli(null); setBlockedStatus(null); }}>
          <div className="fleet-blocked-modal" onClick={(e) => e.stopPropagation()}>
            <span className="fleet-blocked-icon">
              {blockedStatus === 'line' ? '🟡' : '🔴'}
            </span>
            <h3>Aircraft Grounded</h3>
            <p>
              <strong>{blockedHeli}</strong> is currently marked as{' '}
              <strong>{STATUS_META[blockedStatus]?.label}</strong>.
              {' '}Weight & Balance calculations cannot be submitted for this airframe.
            </p>
            <button className="add-btn" onClick={() => { setBlockedHeli(null); setBlockedStatus(null); }}>
              Understood
            </button>
          </div>
        </div>
      )}

      {showDetail && isOps ? (
        <OperationsView registration={selectedHeli} setBackOverride={setBackOverride} onBack={() => setSelectedHeli(null)} />
      ) : showDetail && isMaint ? (
        <MaintenanceView registration={selectedHeli} onBack={() => setSelectedHeli(null)} />
      ) : showDetail && isPilot ? (
        <OperationsView registration={selectedHeli} setBackOverride={setBackOverride} pilotMode onBack={() => setSelectedHeli(null)} />
      ) : (
        <div className="fleet-page">
          <div className="fleet-header">
            <img src="/GAPC.png" alt="GAPC" className="fleet-logo" />
            <h1 className="fleet-title">Fleet Selection</h1>
            <p className="fleet-subtitle">Select an AW139 aircraft to manage performance, weight &amp; balance, and airworthiness status.</p>
          </div>
          <div className="fleet-grid">
            {FLEET.map(({ reg, msn }) => {
              const s = getStatus(reg);
              const meta = STATUS_META[s] || STATUS_META.ready;
              const blocked = isNonOps && s !== 'ready';
              return (
                <button
                  key={reg}
                  className={`fleet-card ${blocked ? 'fleet-card--blocked' : ''}`}
                  onClick={() => handleSelectHeli(reg)}
                >
                  <span className="fleet-model">AW139</span>
                  <span className="fleet-reg">{reg}</span>
                  <span className="fleet-msn">S/N: {msn}</span>
                  <span className={`fleet-status fleet-status--${meta.cls}`}>{meta.label}</span>
                </button>
              );
            })}
          </div>
          <div className="fleet-footer">Algerian Civil Protection Air Group</div>
        </div>
      )}
    </div>
  );
}
