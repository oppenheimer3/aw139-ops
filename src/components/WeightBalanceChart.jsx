import { useMemo } from 'react';

const CG_ENVELOPE = [
  { weight: 3600, cgMin: 3400, cgMax: 3700 },
  { weight: 3800, cgMin: 3400, cgMax: 3800 },
  { weight: 4200, cgMin: 3500, cgMax: 3900 },
  { weight: 4600, cgMin: 3600, cgMax: 4000 },
  { weight: 5000, cgMin: 3700, cgMax: 4100 },
  { weight: 5400, cgMin: 3800, cgMax: 4200 },
  { weight: 5800, cgMin: 3900, cgMax: 4300 },
  { weight: 6200, cgMin: 4000, cgMax: 4400 },
  { weight: 6400, cgMin: 4050, cgMax: 4450 },
  { weight: 6600, cgMin: 4100, cgMax: 4500 },
];

const CHART_PADDING = 40;
const CHART_W = 480;
const CHART_H = 480;

function toPixel(weight, cg) {
  const wMin = 3400, wMax = 6800;
  const cgMin = 3200, cgMax = 4600;
  const x = ((cg - cgMin) / (cgMax - cgMin)) * (CHART_W - 2 * CHART_PADDING) + CHART_PADDING;
  const y = CHART_H - CHART_PADDING - ((weight - wMin) / (wMax - wMin)) * (CHART_H - 2 * CHART_PADDING);
  return { x, y };
}

function envelopePath() {
  const pts = [];
  for (const p of CG_ENVELOPE) {
    pts.push(toPixel(p.weight, p.cgMin));
  }
  for (let i = CG_ENVELOPE.length - 1; i >= 0; i--) {
    pts.push(toPixel(CG_ENVELOPE[i].weight, CG_ENVELOPE[i].cgMax));
  }
  pts.push(pts[0]);
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export default function WeightBalanceChart({ registration }) {
  const { currentPt, inEnvelope } = useMemo(() => {
    const totalWeight = 5200;
    const totalCg = 3900;
    const pt = toPixel(totalWeight, totalCg);
    const inside = CG_ENVELOPE.some((edge, i) => {
      const next = CG_ENVELOPE[(i + 1) % CG_ENVELOPE.length];
      const minY = toPixel(edge.weight, edge.cgMin);
      const maxY = toPixel(next.weight, next.cgMax);
      return pt.x >= Math.min(minY.x, maxY.x) && pt.x <= Math.max(minY.x, maxY.x) &&
             pt.y >= Math.min(minY.y, maxY.y) && pt.y <= Math.max(minY.y, maxY.y);
    });
    return { currentPt: pt, inEnvelope: inside };
  }, []);

  const envelopeD = envelopePath();

  return (
    <div className="wab-page">
      <div className="wab-header">
        <h2>Weight & Balance Chart — {registration}</h2>
      </div>
      <div className="wab-body">
        <div className="wab-chart-container">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="wab-chart">
            <line x1={CHART_PADDING} y1={CHART_H - CHART_PADDING} x2={CHART_W - CHART_PADDING} y2={CHART_H - CHART_PADDING} stroke="#2a4a50" strokeWidth="2" />
            <line x1={CHART_PADDING} y1={CHART_PADDING} x2={CHART_PADDING} y2={CHART_H - CHART_PADDING} stroke="#2a4a50" strokeWidth="2" />
            <path d={envelopeD} fill="rgba(0, 188, 212, 0.15)" stroke="#00bcd4" strokeWidth="2" />
            <circle cx={currentPt.x} cy={currentPt.y} r="6" fill={inEnvelope ? '#4ade80' : '#f87171'} stroke={inEnvelope ? '#22c55e' : '#ef4444'} strokeWidth="2" />
            <text x={currentPt.x + 12} y={currentPt.y - 8} fill="#e0f0f2" fontSize="12" fontWeight="600">
              CG {inEnvelope ? '✓' : '✗'}
            </text>
            {CG_ENVELOPE.map((p) => {
              const pt = toPixel(p.weight, p.cgMin);
              return <circle key={`min-${p.weight}`} cx={pt.x} cy={pt.y} r="2" fill="#80deea" />;
            })}
            {CG_ENVELOPE.map((p) => {
              const pt = toPixel(p.weight, p.cgMax);
              return <circle key={`max-${p.weight}`} cx={pt.x} cy={pt.y} r="2" fill="#80deea" />;
            })}
            {[3600, 4200, 5000, 5800, 6400].map((w) => {
              const pt = toPixel(w, 3400);
              return (
                <text key={`wl-${w}`} x={pt.x - 35} y={pt.y + 4} fill="#90c0c9" fontSize="10">
                  {w}
                </text>
              );
            })}
            {[3400, 3700, 4000, 4300, 4600].map((cg) => {
              const pt = toPixel(4800, cg);
              return (
                <text key={`cgl-${cg}`} x={pt.x - 8} y={pt.y + 30} fill="#90c0c9" fontSize="10" textAnchor="middle">
                  {cg}
                </text>
              );
            })}
          </svg>
          <div className="wab-labels">
            <span>Weight (kg)</span>
            <span>CG (mm)</span>
          </div>
        </div>
        <div className="wab-info">
          <h3>Loading State</h3>
          <div className="wab-info-row">
            <span>Total Weight</span>
            <span className="num">5,200.0 kg</span>
          </div>
          <div className="wab-info-row">
            <span>CG Position</span>
            <span className="num">3,900.0 mm</span>
          </div>
          <div className="wab-info-row">
            <span>Status</span>
            <span className={`num ${inEnvelope ? 'green' : 'red'}`}>
              {inEnvelope ? 'Within Limits ✓' : 'Out of Limits ✗'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
