import { useState } from 'react';
import MaintenanceLog from './MaintenanceLog';
import MaintenanceConfig from './MaintenanceConfig';
import MaintenanceStatus from './MaintenanceStatus';

const PAGES = [
  { id: 'status', label: 'Maintenance Status' },
  { id: 'config', label: 'Helicopter Configuration' },
  { id: 'log', label: 'Weight & Balance Records' },
];

export default function MaintenanceView({ registration, onBack }) {
  const [activePage, setActivePage] = useState('status');

  return (
    <div className="ops-view">
      <nav className="ops-sidebar">
        <div className="ops-sidebar-label" onClick={onBack}>
          <span className="arrow">❮</span>
          <span>{registration}</span>
        </div>
        {PAGES.map((p) => (
          <button
            key={p.id}
            className={`ops-sidebar-btn ${activePage === p.id ? 'active' : ''}`}
            onClick={() => setActivePage(p.id)}
          >
            {p.label}
          </button>
        ))}
      </nav>
      <div className="ops-content">
        {activePage === 'status' ? (
          <MaintenanceStatus registration={registration} />
        ) : activePage === 'config' ? (
          <MaintenanceConfig registration={registration} />
        ) : (
          <MaintenanceLog registration={registration} />
        )}
      </div>
    </div>
  );
}
