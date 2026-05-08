import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

const Configuration = () => {
  

 // BECAME PARENT SIDE BAR
 

  



  /* ---------------- UI ---------------- */

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
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
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

              <div className="threshold-grid">
                <div className="field">
                  <label>AQI</label>
                  <input type="number" name="Aqi" value={formData.Aqi} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>CO</label>
                  <input type="number" name="CO" value={formData.CO} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>Temperature</label>
                  <input type="number" name="Temperature" value={formData.Temperature} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>Humidity</label>
                  <input type="number" name="Humidity" value={formData.Humidity} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>PM 2.5</label>
                  <input type="number" name="PM25" value={formData.PM25} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>PM 10</label>
                  <input type="number" name="PM10" value={formData.PM10} onChange={handleChange} />
                </div>
              </div>

              <div className="action-row">
                <button className="add-btn">Add Threshold</button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleUpdate()
        }}
        className="threshold-box"
      >
        <div className="modal-header">
          <h3>Edit Threshold</h3>
          <button
            type="button"
            className="close-btn"
            onClick={() => setShowEditModal(false)}
          >
            ✕
          </button>
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

        <div className="threshold-grid">
          <div className="field">
            <label>AQI</label>
            <input type="number" name="Aqi" value={editData.Aqi} onChange={handleEditChange} />
          </div>

          <div className="field">
            <label>CO</label>
            <input type="number" name="CO" value={editData.CO} onChange={handleEditChange} />
          </div>

          <div className="field">
            <label>Temperature</label>
            <input type="number" name="Temperature" value={editData.Temperature} onChange={handleEditChange} />
          </div>

          <div className="field">
            <label>Humidity</label>
            <input type="number" name="Humidity" value={editData.Humidity} onChange={handleEditChange} />
          </div>

          <div className="field">
            <label>PM 2.5</label>
            <input type="number" name="PM25" value={editData.PM25} onChange={handleEditChange} />
          </div>

          <div className="field">
            <label>PM 10</label>
            <input type="number" name="PM10" value={editData.PM10} onChange={handleEditChange} />
          </div>
        </div>

        <div className="action-row">
          <button className="save-btn">Save Changes</button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => setShowEditModal(false)}
          >
            Cancel
          </button>
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
        <th>AQI</th>
        <th>CO</th>
        <th>Temp</th>
        <th>Humidity</th>
        <th>PM2.5</th>
        <th>PM10</th>
        <th>Actions</th>
      </tr>
    </thead>

    <tbody>
      {thresholds.map(t => (
        <tr key={t._id}>
          <td>{t.label}</td>
          <td>{t.Aqi ?? '—'}</td>
          <td>{t.CO ?? '—'}</td>
          <td>{t.Temperature ?? '—'}</td>
          <td>{t.Humidity ?? '—'}</td>
          <td>{t.PM25 ?? '—'}</td>
          <td>{t.PM10 ?? '—'}</td>

          {/*edit and delete button */}
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

      {/* EMPTY STATE (same style as AuditLogs) */}
      {thresholds.length === 0 && (
        <tr>
          <td colSpan="8" style={{ textAlign: 'center', padding: '15px' }}>
            No thresholds configured
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

<div className="section-header">
      <h2 className="page-title">Virtual Bulletin Board</h2>
    </div>

<div className="section-header">
      <h2 className="page-title">Educational Media Display</h2>
    </div>

    <div className="media-upload">
  <input type="file" accept="video/*" onChange={handleFileChange} />
  <button className="add-btn" onClick={handleUpload}>
    Upload Video
  </button>
</div>

<div className="media-list">
  {mediaList.map(m => (
    <div key={m._id} className="media-card">
      <video width="250" controls>
        <source
          src={`https://vortex5-capstone.onrender.com${m.videoUrl}`}
          type="video/mp4"
        />
      </video>

      <button
        className="danger-media-btn"
        onClick={async () => {
          await fetch(`/api/media/${m._id}`, { method: 'DELETE' })
          setMediaList(prev => prev.filter(x => x._id !== m._id))
        }}
      >
        Delete
      </button>
    </div>
  ))}
</div>
    </div>
    
  )
}



export default Configuration