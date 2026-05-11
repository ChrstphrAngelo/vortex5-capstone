import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import {
  Activity, AlertTriangle, Cpu, Users,
  Wifi, WifiOff, Plus, Megaphone, Settings, BarChart3,
} from 'lucide-react'

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

const AdminDashboard = () => {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    if (!user) return

    const fetchData = async (isInitial = false) => {
      if (isInitial) setLoading(true)
      try {
        const res = await fetch('/api/dashboard/summary', {
          headers: { Authorization: `Bearer ${user.token}` }
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load dashboard')
        setData(json)
        setLastUpdated(new Date())
        setError('')
      } catch (err) {
        setError(err.message)
      } finally {
        if (isInitial) setLoading(false)
      }
    }

    fetchData(true)
    const interval = setInterval(() => fetchData(false), 10000)
    return () => clearInterval(interval)
  }, [user])

  if (loading) {
    return <div className="dash-page"><p>Loading dashboard...</p></div>
  }
  if (error) {
    return <div className="dash-page"><p style={{ color: 'red' }}>{error}</p></div>
  }
  if (!data) return null

  const { kpis, devices, alerts } = data

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">
            Welcome back, {user.firstName}. Here's what's happening with your sensors.
          </p>
        </div>
        {lastUpdated && (
          <div className="dash-live">
            <span className="dash-live-dot" />
            Live · Updated {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="dash-kpis">
        <KpiTile
          icon={<Cpu size={20} />}
          label="Devices Online"
          value={`${kpis.onlineDevices} / ${kpis.totalDevices}`}
          accent={kpis.offlineDevices > 0 ? '#dc2626' : '#16a34a'}
        />
        <KpiTile
          icon={<Users size={20} />}
          label="Users"
          value={kpis.userCount}
          accent="#2563eb"
          onClick={() => navigate('/user-management')}
        />
        <KpiTile
          icon={<AlertTriangle size={20} />}
          label="Active Alerts"
          value={kpis.activeAlerts}
          accent={kpis.activeAlerts > 0 ? '#dc2626' : '#94a3b8'}
        />
        <KpiTile
          icon={<Activity size={20} />}
          label="Average AQI"
          value={kpis.avgAqi}
          sub={kpis.avgCategory}
          accent={CATEGORY_COLORS[kpis.avgCategory] || '#94a3b8'}
        />
      </div>

      {/* Main two-column layout */}
      <div className="dash-grid">

        {/* Devices */}
        <div className="dash-section">
          <div className="dash-section-head">
            <h2>Devices</h2>
            <span className="dash-section-count">{devices.length} total</span>
          </div>

          {devices.length === 0 ? (
            <div className="dash-empty">
              No devices yet. Use the BewAir mobile app to provision a new sensor.
            </div>
          ) : (
            <div className="dash-device-grid">
              {devices.map(d => {
                const status = STATUS_LABELS[d.status] || STATUS_LABELS.offline
                const aqiColor = d.category
                  ? CATEGORY_COLORS[d.category]
                  : '#94a3b8'
                return (
                  <div key={d.deviceId} className="dash-device-card">
                    <div className="dash-device-head">
                      <div>
                        <div className="dash-device-name">{d.name}</div>
                        <div className="dash-device-room">{d.room}</div>
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

                    <div className="dash-device-metrics">
                      <Metric label="PM2.5"   value={d.pm25 != null ? `${d.pm25} µg/m³` : '--'} />
                      <Metric label="CO₂"     value={d.co2  != null ? `${d.co2} ppm` : '--'} />
                      <Metric label="Temp"    value={d.temp != null ? `${d.temp.toFixed(1)}°C` : '--'} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="dash-section">
          <div className="dash-section-head">
            <h2>Current Alerts</h2>
            <span className="dash-section-count">{alerts.length} active</span>
          </div>

          {alerts.length === 0 ? (
            <div className="dash-empty dash-empty-ok">
              <span className="dash-ok-icon">✓</span>
              All sensors within thresholds.
            </div>
          ) : (
            <div className="dash-alert-list">
              {alerts.slice(0, 10).map((a, i) => (
                <div
                  key={i}
                  className={`dash-alert dash-alert-${a.severity}`}
                >
                  <div className="dash-alert-head">
                    <strong>{a.name}</strong>
                    <span className="dash-alert-room">{a.room}</span>
                  </div>
                  <div className="dash-alert-detail">
                    <span className="dash-alert-field">{labelFor(a.field)}</span>
                    <span className="dash-alert-value">
                      {a.value} <span className="dash-alert-limit">/ {a.limit}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dash-actions">
        <button className="dash-action-btn" onClick={() => navigate('/user-management')}>
          <Users size={18} />
          Manage Users
        </button>
        <button className="dash-action-btn" onClick={() => navigate('/analytics')}>
          <BarChart3 size={18} />
          View Analytics
        </button>
        <button className="dash-action-btn" onClick={() => navigate('/configuration')}>
          <Settings size={18} />
          Settings
        </button>
        <button className="dash-action-btn" onClick={() => navigate('/bulletin-board')}>
          <Megaphone size={18} />
          Bulletin Board
        </button>
      </div>
    </div>
  )
}

// ============ Sub-components ============
const KpiTile = ({ icon, label, value, sub, accent, onClick }) => (
  <div
    className={`dash-kpi ${onClick ? 'dash-kpi-clickable' : ''}`}
    style={{ borderTopColor: accent }}
    onClick={onClick}
  >
    <div className="dash-kpi-icon" style={{ color: accent }}>{icon}</div>
    <div className="dash-kpi-label">{label}</div>
    <div className="dash-kpi-value" style={{ color: accent }}>{value}</div>
    {sub && <div className="dash-kpi-sub">{sub}</div>}
  </div>
)

const Metric = ({ label, value }) => (
  <div className="dash-metric">
    <div className="dash-metric-label">{label}</div>
    <div className="dash-metric-value">{value}</div>
  </div>
)

const labelFor = (field) => ({
  Aqi:          'AQI',
  PM25:         'PM 2.5',
  PM10:         'PM 10',
  CO2:          'CO₂',
  TVOC:         'TVOC',
  Formaldehyde: 'HCHO',
}[field] || field)

export default AdminDashboard
