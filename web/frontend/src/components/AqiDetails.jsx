import { componentInsight, aqiCategory, CATEGORY_COLORS } from '../utils/airQualityGuidance'

const fmt = (v, d = 1) => {
  if (v == null) return '—'
  return typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(d) : String(v)
}

// Visual max per metric — used only to scale the fill bar
const BAR_MAX = {
  pm1: 150, pm25: 150, pm10: 350,
  co2: 2500, tvoc: 3000, hcho: 500,
  temp: 45,  humidity: 100,
}

const MetricTile = ({ label, value, unit, insightKey }) => {
  const insight  = componentInsight(insightKey, value)
  const color    = insight?.color || '#94a3b8'
  const level    = insight?.level || null
  const fillPct  = value != null
    ? Math.min((value / (BAR_MAX[insightKey] || 500)) * 100, 100)
    : 0

  return (
    <div className="aqt-tile" style={{ '--aqt-color': color }}>
      {/* top row: label + status badge */}
      <div className="aqt-top">
        <span className="aqt-label">{label}</span>
        {level && (
          <span className="aqt-badge" style={{ background: color + '20', color }}>
            {level}
          </span>
        )}
      </div>

      {/* value */}
      <div className="aqt-value">
        {fmt(value)}
        {value != null && <span className="aqt-unit"> {unit}</span>}
      </div>

      {/* thin fill bar */}
      <div className="aqt-bar-track">
        <div className="aqt-bar-fill" style={{ width: `${fillPct}%`, background: color }} />
      </div>
    </div>
  )
}

const AqiDetails = ({ aqi }) => {
  const aqiVal   = aqi?.Aqi
  const category = aqiCategory(aqiVal)
  const catColor = CATEGORY_COLORS[category] || '#94a3b8'

  const metrics = [
    { label: 'PM 1.0',   value: aqi?.PM1,          unit: 'µg/m³', key: 'pm1'      },
    { label: 'PM 2.5',   value: aqi?.PM25,         unit: 'µg/m³', key: 'pm25'     },
    { label: 'PM 10',    value: aqi?.PM10,         unit: 'µg/m³', key: 'pm10'     },
    { label: 'CO₂',      value: aqi?.CO2,          unit: 'ppm',   key: 'co2'      },
    { label: 'TVOC',     value: aqi?.TVOC,         unit: 'µg/m³', key: 'tvoc'     },
    { label: 'HCHO',     value: aqi?.Formaldehyde, unit: 'ppb',   key: 'hcho'     },
    { label: 'Temp',     value: aqi?.Temperature,  unit: '°C',    key: 'temp'     },
    { label: 'Humidity', value: aqi?.Humidity,     unit: '%',     key: 'humidity' },
  ]

  return (
    <div className="aqi-simple-root">

      {/* AQI summary */}
      <div className="aqi-summary-card">
        <div className="aqi-summary-left">
          <div className="aqi-summary-number" style={{ color: catColor }}>
            {aqiVal ?? '—'}
          </div>
          <div>
            <div className="aqi-summary-label">Air Quality Index</div>
            <div className="aqi-summary-category" style={{ color: catColor }}>
              {category || 'No data'}
            </div>
          </div>
        </div>

        <div className="aqi-summary-divider" />

        <div className="aqi-summary-right">
          <div className="aqi-summary-pair">
            <span className="aqi-summary-pair-label">Temperature</span>
            <span className="aqi-summary-pair-value">
              {aqi?.Temperature != null ? `${fmt(aqi.Temperature)} °C` : '—'}
            </span>
          </div>
          <div className="aqi-summary-pair">
            <span className="aqi-summary-pair-label">Humidity</span>
            <span className="aqi-summary-pair-value">
              {aqi?.Humidity != null ? `${fmt(aqi.Humidity)} %` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="aqi-simple-grid">
        {metrics.map(({ label, value, unit, key }) => (
          <MetricTile key={key} label={label} value={value} unit={unit} insightKey={key} />
        ))}
      </div>

    </div>
  )
}

export default AqiDetails
