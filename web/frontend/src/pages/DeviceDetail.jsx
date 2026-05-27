import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { ArrowLeft, UserPlus, UserX, Users, Loader2 } from 'lucide-react'
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
  const [history, setHistory] = useState([])

  // --- Sharing state (admin only) ---
  const [sharedUsers, setSharedUsers] = useState([])
  const [shareEmail, setShareEmail] = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [shareMsg, setShareMsg] = useState({ text: '', type: '' }) // type: 'ok' | 'err'
  const [revokeTarget, setRevokeTarget] = useState(null) // email to confirm revoke

  // ---------- Fetch device + latest AQI ----------
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

    // Fetch recent history once for sparklines (last 30 readings for this device)
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/aqi', {
          headers: { Authorization: `Bearer ${user.token}` }
        })
        if (res.ok) {
          const all = await res.json()
          // Filter to this device, already sorted newest-first (limit 500)
          const deviceHistory = all
            .filter(r => r.deviceId === deviceId)
            .slice(0, 30)
          setHistory(deviceHistory)
        }
      } catch (err) {
        console.error('history:', err)
      }
    }

    fetchData()
    fetchHistory()
    const interval = setInterval(fetchData, 10000)
    // Refresh history every 2 minutes
    const histInterval = setInterval(fetchHistory, 120000)
    return () => {
      clearInterval(interval)
      clearInterval(histInterval)
    }
  }, [user, deviceId])

  // ---------- Fetch shared users (admin only) ----------
  const loadSharedUsers = useCallback(async () => {
    if (!user || user.role !== 'admin') return
    try {
      const res = await fetch(`/api/device/${deviceId}/users`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSharedUsers(data)
      }
    } catch (err) {
      console.error('loadSharedUsers:', err)
    }
  }, [user, deviceId])

  useEffect(() => {
    loadSharedUsers()
  }, [loadSharedUsers])

  // ---------- Share device ----------
  const handleShare = async (e) => {
    e.preventDefault()
    const email = shareEmail.trim()
    if (!email) return
    setShareLoading(true)
    setShareMsg({ text: '', type: '' })
    try {
      const res = await fetch(`/api/device/${deviceId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ email })
      })
      const json = await res.json()
      if (res.ok) {
        setShareEmail('')
        setShareMsg({ text: json.message || 'Device shared successfully.', type: 'ok' })
        await loadSharedUsers()
      } else {
        setShareMsg({ text: json.error || 'Failed to share device.', type: 'err' })
      }
    } catch {
      setShareMsg({ text: 'Network error. Please try again.', type: 'err' })
    } finally {
      setShareLoading(false)
      setTimeout(() => setShareMsg({ text: '', type: '' }), 4000)
    }
  }

  // ---------- Revoke access ----------
  const handleRevoke = async (email) => {
    setShareLoading(true)
    setShareMsg({ text: '', type: '' })
    try {
      const res = await fetch(`/api/device/${deviceId}/unshare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ email })
      })
      const json = await res.json()
      if (res.ok) {
        setShareMsg({ text: json.message || 'Access revoked.', type: 'ok' })
        setRevokeTarget(null)
        await loadSharedUsers()
      } else {
        setShareMsg({ text: json.error || 'Failed to revoke access.', type: 'err' })
      }
    } catch {
      setShareMsg({ text: 'Network error. Please try again.', type: 'err' })
    } finally {
      setShareLoading(false)
      setTimeout(() => setShareMsg({ text: '', type: '' }), 4000)
    }
  }

  // ---------- Render guards ----------
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

      <AqiDetails
        aqi={displayReading || {
          Aqi: null, Temperature: null, Humidity: null,
          PM1: null, PM25: null, PM10: null,
          TVOC: null, CO2: null, Formaldehyde: null,
        }}
        history={history}
      />

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

      {/* ====== Device Access (admin only) ====== */}
      {user?.role === 'admin' && (
        <div className="dash-section device-access-section">
          <div className="dash-section-head">
            <h2><Users size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Device Access</h2>
            <span className="dash-section-count">{sharedUsers.length} user{sharedUsers.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Feedback message */}
          {shareMsg.text && (
            <div className={`share-msg share-msg-${shareMsg.type}`}>
              {shareMsg.text}
            </div>
          )}

          {/* Add user form */}
          <form className="share-form" onSubmit={handleShare}>
            <input
              type="email"
              className="search-input share-email-input"
              placeholder="Enter user email to grant access..."
              value={shareEmail}
              onChange={e => setShareEmail(e.target.value)}
              disabled={shareLoading}
            />
            <button
              type="submit"
              className="btn btn-primary share-btn"
              disabled={shareLoading || !shareEmail.trim()}
            >
              {shareLoading
                ? <Loader2 size={15} className="share-spinner" />
                : <UserPlus size={15} />
              }
              Share
            </button>
          </form>

          {/* Users list */}
          {sharedUsers.length === 0 ? (
            <div className="dash-empty" style={{ marginTop: 12 }}>
              No users have access to this device yet.
            </div>
          ) : (
            <div className="share-user-list">
              {sharedUsers.map(u => (
                <div key={u._id} className="share-user-row">
                  <div className="share-user-avatar">
                    {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                  </div>
                  <div className="share-user-info">
                    <div className="share-user-name">
                      {u.firstName && u.lastName
                        ? `${u.firstName} ${u.lastName}`
                        : u.email}
                    </div>
                    <div className="share-user-email">{u.email}</div>
                  </div>
                  <span className={`share-role-badge share-role-${u.role}`}>
                    {u.role}
                  </span>
                  <button
                    className="icon-btn share-revoke-btn"
                    title="Revoke access"
                    onClick={() => setRevokeTarget(u.email)}
                    disabled={shareLoading}
                  >
                    <UserX size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====== Revoke confirm modal ====== */}
      {revokeTarget && (
        <div className="modal-overlay" onClick={() => setRevokeTarget(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Revoke Access</h3>
            </div>
            <div className="modal-body">
              <p>
                Remove <strong>{revokeTarget}</strong> from this device?
                They will no longer be able to view its data.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setRevokeTarget(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleRevoke(revokeTarget)}
                disabled={shareLoading}
              >
                {shareLoading ? 'Revoking...' : 'Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeviceDetail
