import { useState } from 'react';
import Performance from './Performance';

const MENU = [
  {
    id: 'cat-a',
    label: 'Cat A Charts',
    icon: '🚁',
    desc: 'Vertical, backup, short field and helideck procedures',
    items: [
      { id: 'vertical', label: 'Vertical Procedures', active: true },
      { id: 'backup', label: 'Back Up Procedures', active: false },
      { id: 'short-field', label: 'Short Field / Clear Area / Confined Area Procedures', active: false },
      { id: 'helideck', label: 'Offshore Helideck Procedure', active: false },
    ],
  },
  {
    id: 'cat-b',
    label: 'Cat B Charts',
    icon: '📊',
    desc: 'WAT Limitations for Category B operations',
    items: [
      { id: 'wat', label: 'WAT Limitations (Figure 1-5)', active: false },
    ],
  },
  {
    id: 'atmospheric',
    label: 'Atmospheric Charts',
    icon: '☁️',
    desc: 'Density Altitude charts for performance calculations',
    items: [
      { id: 'density-alt', label: 'Density Altitude', active: false },
    ],
  },
  {
    id: 'perf-data',
    label: 'Performance Data',
    icon: '⚡',
    desc: 'Hover power, height loss, ceiling, climb and fuel data',
    items: [
      { id: 'hover-power', label: 'Hover Power (100% NR / 102% NR)', active: false },
      { id: 'height-loss', label: 'Height Loss During Flyaway', active: false },
      { id: 'hover-ceiling', label: 'Hover Ceiling (AEO)', active: false },
      { id: 'roc', label: 'Rate of Climb (AEO / OEI)', active: false },
      { id: 'fuel-consumption', label: 'Fuel Consumption', active: false },
    ],
  },
];

export default function PerformanceHub({ registration }) {
  const [sectionPage, setSectionPage] = useState(null);
  const [activePage, setActivePage] = useState(null);

  if (activePage === 'vertical') {
    return <Performance registration={registration} onBack={() => setActivePage(null)} />;
  }

  if (sectionPage) {
    const section = MENU.find((s) => s.id === sectionPage);
    return (
      <div className="config-page">
        <div className="saved-page-content">
          <button className="back-btn" onClick={() => setSectionPage(null)} style={{ marginBottom: 16 }}>← Back to menu</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--cyan-300)', margin: '0 0 24px' }}>{section.label}</h2>
          <div className="perf-hub-grid">
            {section.items.map((item) => (
              <div
                key={item.id}
                className={`perf-hub-card ${item.active ? 'perf-hub-card--active' : 'perf-hub-card--locked'}`}
                onClick={() => item.active && item.id === 'vertical' && setActivePage('vertical')}
              >
                <div className="perf-hub-title">{item.label}</div>
                {!item.active && <span className="perf-hub-coming">Coming Soon</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="config-page">
      <div className="saved-page-content">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--cyan-300)', margin: '0 0 24px' }}>PERFORMANCE MAIN MENU</h2>
        <div className="perf-hub-grid">
          {MENU.map((section) => (
            <div
              key={section.id}
              className="perf-hub-card perf-hub-card--active"
              onClick={() => setSectionPage(section.id)}
            >
              <div className="perf-hub-icon">{section.icon}</div>
              <div className="perf-hub-title">{section.label}</div>
              <div className="perf-hub-desc">{section.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
