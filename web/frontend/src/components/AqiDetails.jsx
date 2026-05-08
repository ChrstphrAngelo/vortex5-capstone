const fmt = (v, suffix = '') =>
  v === null || v === undefined ? '—' : `${v}${suffix}`

const AqiDetails = ({ aqi }) => {
  return (
    <div className="aqi-card">
      {/* Top section */}
      <div className="aqi-top">
        <div className="aqi-main">
          <h2>AQI</h2>
          <span>{fmt(aqi.Aqi)}</span>
        </div>

        <div className="aqi-side">
          <div className="aqi-box">
            <strong>Temperature</strong>
            <span>{fmt(aqi.Temperature, '°C')}</span>
          </div>
          <div className="aqi-box">
            <strong>Humidity</strong>
            <span>{fmt(aqi.Humidity, '%')}</span>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="aqi-bottom">
        <div className="aqi-box">
          <strong>PM 1.0</strong>
          <span>{fmt(aqi.PM1)}</span>
        </div>
        <div className="aqi-box">
          <strong>PM 2.5</strong>
          <span>{fmt(aqi.PM25)}</span>
        </div>
        <div className="aqi-box">
          <strong>PM 10</strong>
          <span>{fmt(aqi.PM10)}</span>
        </div>
        <div className="aqi-box">
          <strong>TVOC</strong>
          <span>{fmt(aqi.TVOC)}</span>
        </div>
        <div className="aqi-box">
          <strong>CO₂</strong>
          <span>{fmt(aqi.CO2, ' ppm')}</span>
        </div>
        <div className="aqi-box">
          <strong>HCHO</strong>
          <span>{fmt(aqi.Formaldehyde)}</span>
        </div>
      </div>
    </div>
  )
}

export default AqiDetails
