import { componentInsight, aqiCategory, CATEGORY_COLORS } from '../utils/airQualityGuidance'

// ── SVG ring gauge ──────────────────────────────────────────────────────────
const RING_R = 42
const RING_C = 2 * Math.PI * RING_R // ≈ 263.9

const RingGauge = ({ value, max, color }) => {
  const pct = value != null ? Math.min(value / max, 1) : 0
  const filled = pct * RING_C
  return (
    <svg viewBox="0 0 100 100" className="aqi-ring-svg" aria-hidden="true">
      {/* Track */}
      <circle cx="50" cy="50" r={RING_R} fill="none"
        className="aqi-ring-track" strokeWidth="9" />
      {/* Progress */}
      <circle cx="50" cy="50" r={RING_R} fill="none"
        stroke={color} strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${RING_C}`}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease' }} />
    </svg>
  )
}

// ── Mini SVG sparkline ────────────────────────────────────────────────────────
const Sparkline = ({ data, color }) => {
  if (!data || data.length < 2) return null
  const W = 72, H = 26
  const valid = data.filter(v => v != null)
  if (valid.length < 2) return null
  const max = Math.max(...valid)
  const min = Math.min(...valid)
  const range = max - min || 1
  const pts = valid.map((v, i) => {
    const x = ((i / (valid.length - 1)) * W).toFixed(1)
    const y = (H - ((v - min) / range) * H).toFixed(1)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none"
        stroke={color || '#94a3b8'} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ── Format helper ─────────────────────────────────────────────────────────────
const fmt = (v, decimals = 1) => {
  if (v == null) return '—'
  return typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(decimals) : String(v)
}

// Max scale for each metric's fill bar (visual reference, not a hard threshold)
const BAR_MAX = {
  pm1: 150, pm25: 150, pm10: 350,
  co2: 2500, tvoc: 3000, hcho: 500,
  temp: 40, humidity: 100,
}

// ── Individual metric card ────────────────────────────────────────────────────
const MetricCard = ({ label, value, unit, insightKey, sparkData }) => {
  const insight = componentInsight(insightKey, value)
  const color  = insight?.color  || '#94a3b8'
  const level  = insight?.level  || (value != null ? 'N/A' : '—')
  const fillPct = value != null
    ? Math.min((value / (BAR_MAX[insightKey] || 500)) * 100, 100)
    : 0

  return (
    <div className="aqi-mc" style={{ '--mc-accent': color }}>
      <div className="aqi-mc-top">
        <span className="aqi-mc-label">{label}</span>
        <span className="aqi-mc-badge" style={{ background: color + '22', color }}>
          {level}
        </span>
      </div>

      <div className="aqi-mc-value">
        {value != null ? fmt(value) : '—'}
        {value != null && <span className="aqi-mc-unit"> {unit}</span>}
      </div>

      <div className="aqi-mc-bar-track">
        <div className="aqi-mc-bar-fill" style={{ width: `${fillPct}%`, background: color }} />
      </div>

      {sparkData && (
        <div className="aqi-mc-spark">
          <Sparkline data={sparkData} color={color} />
        </div>
      )}
    </div>
  )
}

// ── Compact row for Temp / Humidity inside the hero ──────────────────────────
const HeroMetric = ({ label, value, unit }) => (
  <div className="aqi-hero-metric">
    <span className="aqi-hero-metric-label">{label}</span>
    <span className="aqi-hero-metric-value">
      {value != null ? `${fmt(value)} ${unit}` : '—'}
    </span>
  </div>
)

// ── Main exported component ───────────────────────────────────────────────────
// Props:
//   aqi     – latest reading object (or empty-shape {} when offline)
//   history – array of recent reading objects, newest first (optional)
const AqiDetails = ({ aqi, history }) => {
  const aqiVal  = aqi?.Aqi
  const category = aqiCategory(aqiVal)
  const catColor = CATEGORY_COLORS[category] || '#94a3b8'

  // Build per-field sparkline arrays (newest→oldest reversed to left→right)
  const spark = (field) => {
    if (!history || history.length < 2) return null
    return [...history]
      .reverse()
      .map(r => r[field])
      .filter(v => v != null)
      .slice(-20)
  }

  return (
    <div className="aqi-detail-root">

      {/* ═══ AQI Hero Card ═══ */}
      <div className="aqi-hero-card">
        {/* Ring + number */}
        <div className="aqi-hero-gauge-wrap">
          <RingGauge value={aqiVal} max={500} color={catColor} />
          <div className="aqi-hero-overlay">
            <div className="aqi-hero-number" style={{ color: catColor }}>
              {aqiVal ?? '—'}
            </div>
            <div className="aqi-hero-sublabel">AQI</div>
          </div>
        </div>

        {/* Category + supporting metrics + sparkline */}
        <div className="aqi-hero-body">
          <div className="aqi-hero-category-pill"
            style={{ background: catColor + '1a', color: catColor, borderColor: catColor + '40' }}>
            {category || 'No data'}
          </div>

          <div className="aqi-hero-support">
            <HeroMetric label="Temperature" value={aqi?.Temperature} unit="°C" />
            <HeroMetric label="Humidity"    value={aqi?.Humidity}    unit="%" />
          </div>

          {spark('Aqi') && (
            <div className="aqi-hero-spark-wrap">
              <span className="aqi-hero-spark-caption">AQI · last 20 readings</span>
              <Sparkline data={spark('Aqi')} color={catColor} />
            </div>
          )}
        </div>
      </div>

      {/* ═══ 8-metric Grid ═══ */}
      <div className="aqi-metrics-grid">
        <MetricCard label="PM 1.0"   value={aqi?.PM1}          unit="µg/m³" insightKey="pm1"      sparkData={spark('PM1')} />
        <MetricCard label="PM 2.5"   value={aqi?.PM25}         unit="µg/m³" insightKey="pm25"     sparkData={spark('PM25')} />
        <MetricCard label="PM 10"    value={aqi?.PM10}         unit="µg/m³" insightKey="pm10"     sparkData={spark('PM10')} />
        <MetricCard label="CO₂"      value={aqi?.CO2}          unit="ppm"   insightKey="co2"      sparkData={spark('CO2')} />
        <MetricCard label="TVOC"     value={aqi?.TVOC}         unit="µg/m³" insightKey="tvoc"     sparkData={spark('TVOC')} />
        <MetricCard label="HCHO"     value={aqi?.Formaldehyde} unit="ppb"   insightKey="hcho"     sparkData={spark('Formaldehyde')} />
        <MetricCard label="Temp"     value={aqi?.Temperature}  unit="°C"    insightKey="temp"     sparkData={spark('Temperature')} />
        <MetricCard label="Humidity" value={aqi?.Humidity}     unit="%"     insightKey="humidity" sparkData={spark('Humidity')} />
      </div>

    </div>
  )
}

export default AqiDetails
