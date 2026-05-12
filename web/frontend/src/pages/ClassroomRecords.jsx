import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { School, ArrowLeft, ChevronRight } from 'lucide-react'

const CATEGORY_COLORS = {
  'Good': '#16a34a',
  'Moderate': '#f59e0b',
  'Unhealthy (SG)': '#ea580c',
  'Unhealthy': '#dc2626',
  'Very Unhealthy': '#9333ea',
  'Hazardous': '#7f1d1d',
}

const STATUS_LABELS = {
  active:    { label: 'Active',   color: '#16a34a', bg: '#dcfce7' },
  available: { label: 'No Data',  color: '#d97706', bg: '#fef3c7' },
  offline:   { label: 'Inactive', color: '#dc2626', bg: '#fee2e2' },
}

function aqiCategory(aqi) {
  if (aqi == null) return null
  if (aqi <= 50)  return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy (SG)'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

const ClassroomRecords = () => {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null) // null = show room grid

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/summary', {
          headers: { Authorization: `Bearer ${user.token}` }
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load')
        setDevices(json.devices)
        setError('')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [user])

  // Group devices by room
  const rooms = useMemo(() => {
    const map = {}
    for (const d of devices) {
      const key = d.room?.trim() || 'Unassigned'
      if (!map[key]) {
        map[key] = { room: key, devices: [], aqis: [], online: 0 }
      }
      map[key].devices.push(d)
      if (d.aqi != null) map[key].aqis.push(d.aqi)
      if (d.status === 'active' || d.status === 'available') map[key].online += 1
    }

    return Object.values(map)
      .map(r => ({
        ...r,
        avgAqi: r.aqis.length > 0
          ? Math.round(r.aqis.reduce((s, v) => s + v, 0) / r.aqis.length)
          : null,
      }))
      .sort((a, b) => a.room.localeCompare(b.room))
  }, [devices])

  if (loading) return <div className="dash-page"><p>Loading classroom records...</p></div>
  if (error) return <div className="dash-page"><p style={{ color: 'red' }}>{error}</p></div>

  // =============== ROOM DETAIL VIEW ===============
  if (selectedRoom) {
    const roomData = rooms.find(r => r.room === selectedRoom)
    if (!roomData) {
      setSelectedRoom(null) // room no longer exists, go back
      return null
    }

    return (
      <div className="dash-page">
        <button className="dash-back-btn" onClick={() => setSelectedRoom(null)}>
          <ArrowLeft size={18} /> All Rooms
        </button>

        <div className="dash-header" style={{ marginTop: 16 }}>
          <div>
            <h1 className="dash-title">{roomData.room}</h1>
            <p className="dash-subtitle">
              {roomData.devices.length} {roomData.devices.length === 1 ? 'device' : 'devices'} · {roomData.online} online
            </p>
          </div>
        </div>

        <div className="dash-section">
          <div className="dash-device-grid">
            {roomData.devices.map(d => {
              const status = STATUS_LABELS[d.status] || STATUS_LABELS.offline
              const aqiColor = d.category ? CATEGORY_COLORS[d.category] : '#94a3b8'
              return (
                <div
                  key={d.deviceId}
                  className="dash-device-card dash-device-card-clickable"
                  onClick={() => navigate(`/device/${d.deviceId}`)}
                >
                  <div className="dash-device-head">
                    <div>
                      <div className="dash-device-name">{d.name}</div>
                      <div className="dash-device-room">{d.deviceId}</div>
                    </div>
                    <span
                      className="dash-status-pill"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="dash-aqi-big" style={{ color: aqiColor }}>
                    {d.aqi != null ? d.aqi : '--'}
                  </div>
                  <div className="dash-aqi-label" style={{ color: aqiColor }}>
                    {d.category || 'No data'}
                  </div>

                  <div className="dash-device-cta">View details →</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // =============== ROOM GRID VIEW ===============
  return (
    <div className="dash-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Classroom Records</h1>
          <p className="dash-subtitle">
            Devices grouped by room. Click a room to see its sensors.
          </p>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="dash-empty">
          No rooms yet. Add a device through the mobile app to get started.
        </div>
      ) : (
        <div className="room-grid">
          {rooms.map(r => {
            const category = r.avgAqi != null ? aqiCategory(r.avgAqi) : null
            const accent = category ? CATEGORY_COLORS[category] : '#94a3b8'
            return (
              <div
                key={r.room}
                className="room-tile"
                style={{ borderTopColor: accent }}
                onClick={() => setSelectedRoom(r.room)}
              >
                <div className="room-tile-head">
                  <div className="room-tile-icon" style={{ color: accent }}>
                    <School size={24} />
                  </div>
                  <ChevronRight size={20} color="#94a3b8" />
                </div>

                <div className="room-tile-name">{r.room}</div>
                <div className="room-tile-sub">
                  {r.devices.length} {r.devices.length === 1 ? 'device' : 'devices'} · {r.online} online
                </div>

                <div className="room-tile-aqi">
                  <div className="room-tile-aqi-value" style={{ color: accent }}>
                    {r.avgAqi != null ? r.avgAqi : '--'}
                  </div>
                  <div className="room-tile-aqi-label">
                    <span style={{ color: accent }}>{category || 'No data'}</span>
                    <span className="room-tile-aqi-meta">Avg AQI</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ClassroomRecords
