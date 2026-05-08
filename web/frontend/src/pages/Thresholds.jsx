import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

const EMPTY_FORM = {
  label: '',
  Aqi: '',
  PM1: '',
  PM25: '',
  PM10: '',
  TVOC: '',
  CO2: '',
  Formaldehyde: '',
  Temperature: '',
  Humidity: ''
}

const FIELD_DEFS = [
  { key: 'Aqi',          label: 'AQI' },
  { key: 'PM1',          label: 'PM 1.0' },
  { key: 'PM25',         label: 'PM 2.5' },
  { key: 'PM10',         label: 'PM 10' },
  { key: 'TVOC',         label: 'TVOC' },
  { key: 'CO2',          label: 'CO₂' },
  { key: 'Formaldehyde', label: 'HCHO' },
  { key: 'Temperature',  label: 'Temperature' },
  { key: 'Humidity',     label: 'Humidity' }
]

const toPayload = (data) => {
  const payload = { label: data.label }
  for (const { key } of FIELD_DEFS) {
    payload[key] = data[key] !== '' ? Number(data[key]) : null
  }
  return payload
}

const Thresholds = () => {
  const [thresholds, setThresholds] = useState([])
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [editData, setEditData] = useState(EMPTY_FORM)

  useEffect(() => {
    const fetchThresholds = async () => {
      const res = await fetch('/api/threshold')
      const json = await res.json()
      if (res.ok) setThresholds(json)
    }
    fetchThresholds()
  }, [])

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleEditChange = (e) =>
    setEditData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/threshold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toPayload(formData))
    })
    const json = await res.json()
    if (res.ok) {
      setThresholds(prev => [json, ...prev])
      setFormData(EMPTY_FORM)
      setShowModal(false)
    }
  }

  const handleDelete = async (id) => {
    const res = await fetch(`/api/threshold/${id}`, { method: 'DELETE' })
    if (res.ok) setThresholds(prev => prev.filter(t => t._id !== id))
  }

  const handleEdit = (t) => {
    setSelectedId(t._id)
    const next = { label: t.label || '' }
    for (const { key } of FIELD_DEFS) next[key] = t[key] ?? ''
    setEditData(next)
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    const res = await fetch(`/api/threshold/${selectedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toPayload(editData))
    })
    const json = await res.json()
    if (res.ok) {
      setThresholds(prev => prev.map(t => (t._id === selectedId ? json : t)))
      setShowEditModal(false)
      setSelectedId(null)
    }
  }

  const renderFields = (data, onChange) => (
    <div className="threshold-grid">
      {FIELD_DEFS.map(({ key, label }) => (
        <div className="field" key={key}>
          <label>{label}</label>
          <input type="number" name={key} value={data[key]} onChange={onChange} />
        </div>
      ))}
    </div>
  )

  return (
    <div className="configuration">
      <div className="section-header">
        <h2 className="page-title">Configure Thresholds</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Add Threshold
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleSubmit} className="threshold-box">
              <div className="modal-header">
                <h3>Configure Threshold</h3>
                <button type="button" className="close-btn" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="label-row">
                <label>Label</label>
                <input
                  type="text"
                  name="label"
                  placeholder="e.g. Unhealthy Air"
                  value={formData.label}
                  onChange={handleChange}
                  required
                />
              </div>

              {renderFields(formData, handleChange)}

              <div className="action-row">
                <button className="add-btn">Add Threshold</button>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form
              onSubmit={(e) => { e.preventDefault(); handleUpdate() }}
              className="threshold-box"
            >
              <div className="modal-header">
                <h3>Edit Threshold</h3>
                <button type="button" className="close-btn" onClick={() => setShowEditModal(false)}>✕</button>
              </div>

              <div className="label-row">
                <label>Label</label>
                <input
                  type="text"
                  name="label"
                  value={editData.label}
                  onChange={handleEditChange}
                  required
                />
              </div>

              {renderFields(editData, handleEditChange)}

              <div className="action-row">
                <button className="save-btn">Save Changes</button>
                <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <hr />

      <h3>Existing Thresholds</h3>

      <div className="table-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Label</th>
              {FIELD_DEFS.map(({ key, label }) => <th key={key}>{label}</th>)}
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {thresholds.map(t => (
              <tr key={t._id}>
                <td>{t.label}</td>
                {FIELD_DEFS.map(({ key }) => <td key={key}>{t[key] ?? '—'}</td>)}
                <td>
                  <div className="action-buttons">
                    <button className="icon-btn edit-btn" onClick={() => handleEdit(t)}>
                      <Pencil size={18} />
                    </button>
                    <button className="icon-btn danger-btn" onClick={() => handleDelete(t._id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {thresholds.length === 0 && (
              <tr>
                <td colSpan={FIELD_DEFS.length + 2} style={{ textAlign: 'center', padding: '15px' }}>
                  No thresholds configured
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Thresholds
