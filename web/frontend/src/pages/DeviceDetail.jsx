import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { ArrowLeft } from 'lucide-react'
import AqiDetails from '../components/AqiDetails'
import RecommendedActions from '../components/RecommendedActions'

const DeviceDetail = () => {
  const { deviceId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [device, setDevice] = useState(null)
  const [reading, setReading] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const [devRes, aqiRes] = await Promise.all([
          fetch('/api/device', {
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          fetch('/api/aqi/latest', {
            headers: { Authorization: `Bearer ${user.token}` }
          }),
        ])

        if (devRes.ok) {
          const devices = await devRes.json()
          const d = devices.find(x => x.deviceId === deviceId)
          setDevice(d || null)
        }

        if (aqiRes.ok) {
          const readings = await aqiRes.json()
          const r = readings.find(x => x.deviceId === deviceId)
          setReading(r || null)
        }

        setLastUpdated(new Date())
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [user, deviceId])

  if (loading) return <div className="dash-page"><p>Loading...</p></div>

  if (!device) {
    return (
      <div className="dash-page">
        <button className="dash-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <p style={{ marginTop: 16 }}>
          Device not found, or you don't have access to it.
        </p>
      </div>
    )
  }

  // Determine if device is currently online (lastSeen < 30s)
  const lastSeen = device.lastSeen ? new Date(device.lastSeen).getTime() : 0
  const isOnline = device.status === 'online' && (Date.now() - lastSeen) < 30 * 1000

  // Only show reading values if the device is actively online.
  // Otherwise clear them to "--" so we don't display stale data.
  const displayReading = isOnline && reading ? reading : null

  return (
    <div className="dash-page">
      <button className="dash-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back to devices
      </button>

      <div className="dash-header" style={{ marginTop: 16 }}>
        <div>
          <h1 className="dash-title">{device.name}</h1>
          <p className="dash-subtitle">
            {device.room}
            {!isOnline && (
              <span style={{
                marginLeft: 12,
                padding: '3px 10px',
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
              }}>
                Inactive
              </span>
            )}
          </p>
        </div>
        {lastUpdated && (
          <div className="dash-live">
            <span
              className="dash-live-dot"
              style={!isOnline ? { background: '#94a3b8', animation: 'none', boxShadow: 'none' } : undefined}
            />
            {isOnline ? 'Live · ' : 'Paused · '}
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Always render the AQI card; pass an empty-shape object when offline so
          all fields show "—" instead of stale values. */}
      <AqiDetails aqi={displayReading || {
        Aqi: null, Temperature: null, Humidity: null,
        PM1: null, PM25: null, PM10: null,
        TVOC: null, CO2: null, Formaldehyde: null,
      }} />

      {isOnline && <RecommendedActions reading={displayReading} />}

      {!isOnline && (
        <div className="dash-empty" style={{ marginTop: 16 }}>
          This device is currently inactive. The last reading was{' '}
          {device.lastSeen
            ? new Date(device.lastSeen).toLocaleString()
            : 'never'}
          . Data will resume when the device comes back online.
        </div>
      )}
    </div>
  )
}

export default DeviceDetail
