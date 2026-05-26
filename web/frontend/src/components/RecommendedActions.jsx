import { ShieldCheck, Info } from 'lucide-react'
import { aqiAdvisory, flaggedComponents } from '../utils/airQualityGuidance'

// Shows credible (EPA/WHO/ASHRAE) recommended actions for the current reading:
//  - overall AQI advisory for the category
//  - per-component actions for any component currently out of its healthy range
const RecommendedActions = ({ reading }) => {
  const aqi = reading?.Aqi
  const advisory = aqiAdvisory(aqi)
  const flagged = flaggedComponents(reading)

  if (!advisory) {
    return (
      <div className="rec-card">
        <div className="rec-head"><Info size={18} /> Recommended Actions</div>
        <p className="rec-empty">No live reading available. Recommendations appear when the device is online.</p>
      </div>
    )
  }

  return (
    <div className="rec-card">
      <div className="rec-head">
        <ShieldCheck size={18} /> Recommended Actions
      </div>

      {/* Overall AQI advisory */}
      <div className="rec-aqi" style={{ borderLeftColor: advisory.color }}>
        <div className="rec-aqi-cat" style={{ color: advisory.color }}>
          {advisory.category}
        </div>
        <ul className="rec-list">
          {advisory.actions.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      </div>

      {/* Per-component flags */}
      {flagged.length > 0 && (
        <div className="rec-components">
          <div className="rec-sub">Components needing attention</div>
          {flagged.map((c) => (
            <div className="rec-comp-row" key={c.label}>
              <span className="rec-comp-dot" style={{ background: c.color }} />
              <div className="rec-comp-text">
                <div className="rec-comp-name">
                  {c.label} <span className="rec-comp-level" style={{ color: c.color }}>· {c.level}</span>
                </div>
                <div className="rec-comp-advice">{c.advice}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {flagged.length === 0 && (
        <div className="rec-allgood">
          <ShieldCheck size={16} /> All individual components are within healthy ranges.
        </div>
      )}

      <div className="rec-source">
        Guidance: U.S. EPA AirNow (AQI), WHO Air Quality Guidelines (PM), EPA IAQ / ASHRAE (CO₂, TVOC, formaldehyde, temp, humidity).
      </div>
    </div>
  )
}

export default RecommendedActions
