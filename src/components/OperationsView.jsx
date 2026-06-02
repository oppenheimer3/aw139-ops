import { useState } from 'react';
import LoadPlanning from './LoadPlanning';
import MaintenanceLog from './MaintenanceLog';
import SavedCalculations from './SavedCalculations';
import PerformanceHub from './PerformanceHub';

const FULL_PAGES = [
  { id: 'saved', label: 'Weight and Balance' },
  { id: 'load', label: 'New Calculation' },
  { id: 'records', label: 'W&B Records' },
];

const PILOT_PAGES = [
  { id: 'saved', label: 'Weight and Balance' },
  { id: 'perf', label: 'Performance' },
  { id: 'records', label: 'W&B Records' },
];

export default function OperationsView({ registration, setBackOverride, pilotMode, onBack }) {
  const [activePage, setActivePage] = useState('saved');
  const pages = pilotMode ? PILOT_PAGES : FULL_PAGES;

  return (
    <div className="ops-view">
      <nav className="ops-sidebar">
        <div className="ops-sidebar-label" onClick={onBack}>
          <span className="arrow">❮</span>
          <span>{registration}</span>
        </div>
        {pages.map((p) => (
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
        {activePage === 'load' ? (
          <LoadPlanning registration={registration} setBackOverride={setBackOverride} />
        ) : activePage === 'saved' ? (
          <SavedCalculations registration={registration} autoSelectLast={pilotMode} hideBack={pilotMode} />
        ) : activePage === 'perf' ? (
          <PerformanceHub registration={registration} />
        ) : (
          <MaintenanceLog registration={registration} readOnly />
        )}
      </div>
    </div>
  );
}
