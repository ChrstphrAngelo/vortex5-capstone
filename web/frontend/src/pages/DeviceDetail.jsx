import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { ArrowLeft, UserPlus, UserX, Users, Loader2, X } from 'lucide-react'
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
  const [shareOpen, setShareOpen] = useState(false)
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
          fetch('/api/device', { headers: { Authorization: `Bearer ${user.token}` } }),
          fetch('/api/aqi/latest', { headers: { Authorization: `Bearer ${user.token}` } }),
        ])

        if (devRes.ok) {
          const devices = await devRes.json()
          setDevice(devices.find(x => x.deviceId === deviceId) || null)
        }

        if (aqiRes.ok) {
          const readings = await aqiRes.json()
          setReading(readings.find(x => x.deviceId === deviceId) || null)
        }

        setLastUpdated(new Date())
      } finally {
        setLoading(false)
      }
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/aqi', { headers: { Authorization: `Bearer ${user.token}` } })
        if (res.ok) {
          const all = await res.json()
          setHistory(all.filter(r => r.deviceId === deviceId).slice(0, 30))
        }
      } catch (err) { console.error('history:', err) }
    }

    fetchData()
    fetchHistory()
    const iv1 = setInterval(fetchData, 10000)
    const iv2 = setInterval(fetchHistory, 120000)
    return () => { clearInterval(iv1); clearInterval(iv2) }
  }, [user, deviceId])

  // ---------- Load staff with access ----------
  const loadSharedUsers = useCallback(async () => {
    if (!user || user.role !== 'admin') return
    try {
      const res = await fetch(`/api/device/${deviceId}/users`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      if (res.ok) setSharedUsers(await res.json())
    } catch (err) { console.error('loadSharedUsers:', err) }
  }, [user, deviceId])

  useEffect(() => { loadSharedUsers() }, [loadSharedUsers])

  // ---------- Share ----------
  const handleShare = async (e) => {
    e.preventDefault()
    const email = shareEmail.trim()
    if (!email) return
    setShareLoading(true)
    setShareMsg({ text: '', type: '' })
    try {
      const res = await fetch(`/api/device/${deviceId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ email })
      })
      const json = await res.json()
      if (res.ok) {
        setShareEmail('')
        setShareMsg({ text: json.message || 'Access granted.', type: 'ok' })
        await loadSharedUsers()
      } else {
        setShareMsg({ text: json.error || 'Failed to share.', type: 'err' })
      }
    } catch {
      setShareMsg({ text: 'Network error. Please try again.', type: 'err' })
    } finally {
      setShareLoading(false)
      setTimeout(() => setShareMsg({ text: '', type: '' }), 4000)
    }
  }

  // ---------- Revoke ----------
  const handleRevoke = async (email) => {
    setShareLoading(true)
    try {
      const res = await fetch(`/api/device/${deviceId}/unshare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ email })
      })
      const json = await res.json()
      if (res.ok) {
        setShareMsg({ text: json.message || 'Access revoked.', type: 'ok' })
        setRevokeTarget(null)
        await loadSharedUsers()
      } else {
        setShareMsg({ text: json.error || 'Failed to revoke.', type: 'err' })
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
        <p style={{ marginTop: 16 }}>Device not found, or you don't have access to it.</p>
      </div>
    )
  }

  const lastSeen = device.lastSeen ? new Date(device.lastSeen).getTime() : 0
  const isOnline = device.status === 'online' && (Date.now() - lastSeen) < 30 * 1000
  const displayReading = isOnline && reading ? reading : null

  return (
    <div className="dash-page">
      <button className="dash-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back to devices
      </button>

      {/* ── Header ── */}
      <div className="dash-header" style={{ marginTop: 16 }}>
        <div>
          <h1 className="dash-title">{device.name}</h1>
          <p className="dash-subtitle">
            {device.room}
            {!isOnline && (
              <span style={{
                marginLeft: 12, padding: '3px 10px',
                background: '#fee2e2', color: '#dc2626',
                borderRadius: 999, fontSize: 12, fontWeight: 700,
              }}>Inactive</span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Share button — admin only */}
          {user?.role === 'admin' && (
            <button
              className="btn btn-secondary share-header-btn"
              onClick={() => setShareOpen(true)}
            >
              <Users size={15} />
              Share
              {sharedUsers.length > 0 && (
                <span className="share-header-count">{sharedUsers.length}</span>
              )}
            </button>
          )}

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
      </div>

      {/* ── Data ── */}
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
          {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'never'}.
          Data will resume when the device comes back online.
        </div>
      )}

      {/* ══════════════════════════════════════════
          Share Modal
      ══════════════════════════════════════════ */}
      {shareOpen && (
        <div className="modal-overlay" onClick={() => { setShareOpen(false); setRevokeTarget(null) }}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="share-modal-head">
              <div>
                <h3 className="share-modal-title">
                  <Users size={18} /> Device Access
                </h3>
                <p className="share-modal-sub">
                  {device.name} · {device.room}
                </p>
              </div>
              <button className="share-modal-close" onClick={() => { setShareOpen(false); setRevokeTarget(null) }}>
                <X size={18} />
              </button>
            </div>

            {/* Info note */}
            <div className="share-modal-note">
              Admins always have full access. Only staff members need to be shared.
            </div>

            {/* Feedback */}
            {shareMsg.text && (
              <div className={`share-msg share-msg-${shareMsg.type}`}>
                {shareMsg.text}
              </div>
            )}

            {/* Staff list */}
            <div className="share-modal-list">
              {sharedUsers.length === 0 ? (
                <div className="share-modal-empty">
                  No staff members have been given access yet.
                </div>
              ) : (
                sharedUsers.map(u => (
                  <div key={u._id} className="share-user-row">
                    <div className="share-user-avatar">
                      {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                    </div>
                    <div className="share-user-info">
                      <div className="share-user-name">
                        {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email}
                      </div>
                      <div className="share-user-email">{u.email}</div>
                    </div>
                    <span className="share-role-badge share-role-staff">Staff</span>
                    {revokeTarget === u.email ? (
                      <div className="share-revoke-confirm">
                        <span>Remove?</span>
                        <button
                          className="btn btn-danger share-confirm-yes"
                          onClick={() => handleRevoke(u.email)}
                          disabled={shareLoading}
                        >
                          {shareLoading ? <Loader2 size={13} className="share-spinner" /> : 'Yes'}
                        </button>
                        <button
                          className="btn btn-secondary share-confirm-no"
                          onClick={() => setRevokeTarget(null)}
                          disabled={shareLoading}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        className="icon-btn share-revoke-btn"
                        title="Remove access"
                        onClick={() => setRevokeTarget(u.email)}
                        disabled={shareLoading}
                      >
                        <UserX size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add user form */}
            <div className="share-modal-footer">
              <form className="share-form" onSubmit={handleShare}>
                <input
                  type="email"
                  className="search-input share-email-input"
                  placeholder="Staff email address..."
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
                  Add
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default DeviceDetail
