import { componentInsight, aqiCategory, CATEGORY_COLORS } from '../utils/airQualityGuidance'

const fmt = (v, d = 1) => {
  if (v == null) return '—'
  return typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(d) : String(v)
}

const AqiDetails = ({ aqi }) => {
  const aqiVal  = aqi?.Aqi
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

      {/* AQI summary row */}
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
        {metrics.map(({ label, value, unit, key }) => {
          const insight = componentInsight(key, value)
          const color = insight?.color || '#e2e8f0'
          return (
            <div key={key} className="aqi-simple-tile" style={{ borderLeftColor: color }}>
              <div className="aqi-simple-tile-label">{label}</div>
              <div className="aqi-simple-tile-value">
                {fmt(value)}
                {value != null && <span className="aqi-simple-tile-unit"> {unit}</span>}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default AqiDetails
