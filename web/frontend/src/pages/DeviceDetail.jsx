import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { ArrowLeft } from 'lucide-react'
import AqiDetails from '../components/AqiDetails'

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

  return (
    <div className="dash-page">
      <button className="dash-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back to devices
      </button>

      <div className="dash-header" style={{ marginTop: 16 }}>
        <div>
          <h1 className="dash-title">{device.name}</h1>
          <p className="dash-subtitle">{device.room}</p>
        </div>
        {lastUpdated && (
          <div className="dash-live">
            <span className="dash-live-dot" />
            Live · Updated {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {reading ? (
        <AqiDetails aqi={reading} />
      ) : (
        <div className="dash-empty">
          No data available for this device yet. It may be offline or still warming up.
        </div>
      )}
    </div>
  )
}

export default DeviceDetail
