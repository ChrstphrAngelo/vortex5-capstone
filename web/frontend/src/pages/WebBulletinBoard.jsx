import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

const WebBulletinBoard = () => {

 /* ------------------ EDUCATIONAL VIDEO -------------- */

  const [videoFile, setVideoFile] = useState(null)
  const [mediaList, setMediaList] = useState([])

  useEffect(() => {
    const fetchMedia = async () => {
    const res = await fetch('/api/media')      
    const json = await res.json()
      if (res.ok) setMediaList(json)
    }

    fetchMedia()
  }, [])

      const handleFileChange = (e) => {
      setVideoFile(e.target.files[0])
    }

    const handleUpload = async () => {
  if (!videoFile) {
    alert('Please choose a video file first.')
    return
  }

  const formData = new FormData()
  formData.append('title', videoFile.name)
  formData.append('video', videoFile)

  try {
    const res = await fetch('/api/media', {
      method: 'POST',
      body: formData
    })

    const json = await res.json()

    if (res.ok) {
      setMediaList(prev => [json, ...prev])
      setVideoFile(null)
      alert(`Uploaded "${videoFile.name}" successfully.`)
    } else {
      alert(`Upload failed: ${json.error || 'Unknown error'}`)
    }
  } catch (err) {
    alert(`Upload failed: ${err.message}`)
  }
}
const [showMediaModal, setShowMediaModal] = useState(false)

/* announcements */

const [showModal, setShowModal] = useState(false)
const [announcements, setAnnouncements] = useState([])

const [showEditModal, setShowEditModal] = useState(false)
const [selectedId, setSelectedId] = useState(null)

const [editData, setEditData] = useState({
  title: '',
  description: '',
  date: '',
  time: ''
})
const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  })
}

const handleSubmit = async (e) => {
  e.preventDefault()

  if (!formData.title || !formData.date) {
    alert('Title and Date are required')
    return
  }

  // 🔌 connect this to your backend later
  const res = await fetch('/api/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })

  const json = await res.json()

  if (res.ok) {
      setAnnouncements(prev => [json, ...prev])
    setShowModal(false)
    setFormData({
      title: '',
      description: '',
      date: '',
      time: ''
    })
  }
}
const [formData, setFormData] = useState({
  title: '',
  description: '',
  date: '',
  time: ''
})
useEffect(() => {
  const fetchAnnouncements = async () => {
    const res = await fetch('/api/announcements')
    const json = await res.json()
    if (res.ok) setAnnouncements(json)
  }

  fetchAnnouncements()
}, [])

const handleDelete = async (id) => {
  const res = await fetch(`/api/announcements/${id}`, {
    method: 'DELETE'
  })

  if (res.ok) {
    setAnnouncements(prev => prev.filter(a => a._id !== id))
  }
}
const handleEdit = (a) => {
  setSelectedId(a._id)
  setEditData({
    title: a.title || '',
    description: a.description || '',
    date: a.date || '',
    time: a.time || ''
  })
  setShowEditModal(true)
}

const handleEditChange = (e) => {
  setEditData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }))
}

const handleUpdate = async () => {
  const res = await fetch(`/api/announcements/${selectedId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(editData)
  })

  const json = await res.json()

  if (res.ok) {
    setAnnouncements(prev =>
      prev.map(a => (a._id === selectedId ? json : a))
    )
    setShowEditModal(false)
    setSelectedId(null)
  }
}

    return(
<div className="configuration">
<div className="section-header">
      <h2 className="page-title">Virtual Bulletin Board</h2>
    </div>

<div className="section-header">
  <h2 className="page-title">Announcements</h2>
  <button className="add-btn" onClick={() => setShowModal(true)}>
    + Add Announcement
  </button>
</div>

{showModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <form onSubmit={handleSubmit} className="threshold-box">

        <div className="modal-header">
          <h3>Create Announcement</h3>
          <button
            type="button"
            className="close-btn"
            onClick={() => setShowModal(false)}
          >
            ✕
          </button>
        </div>

        <div className="label-row">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="label-row">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="threshold-grid">
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="action-row">
          <button className="add-btn">Add Announcement</button>
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
          <h3>Edit Announcement</h3>
          <button
            type="button"
            className="close-btn"
            onClick={() => setShowEditModal(false)}
          >
            ✕
          </button>
        </div>

        <div className="label-row">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={editData.title}
            onChange={handleEditChange}
            required
          />
        </div>

        <div className="label-row">
          <label>Description</label>
          <textarea
            name="description"
            value={editData.description}
            onChange={handleEditChange}
          />
        </div>

        <div className="threshold-grid">
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={editData.date}
              onChange={handleEditChange}
            />
          </div>

          <div className="field">
            <label>Time</label>
            <input
              type="time"
              name="time"
              value={editData.time}
              onChange={handleEditChange}
            />
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

<h3>Existing Announcements</h3>

<div className="table-card">
  <table className="modern-table">
    <thead>
      <tr>
        <th>Title</th>
        <th className="action-col">Status</th>
      </tr>
    </thead>

    <tbody>
      {announcements.map(a => (
        <tr key={a._id}>
          <td>{a.title}</td>

          <td>
            <div className="action-buttons">
              <button
                className="icon-btn edit-btn"
                onClick={() => handleEdit(a)}
              >
                <Pencil size={18} />
              </button>

              <button
                className="icon-btn danger-btn"
                onClick={() => handleDelete(a._id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </td>
        </tr>
      ))}

      {announcements.length === 0 && (
        <tr>
          <td colSpan="2" style={{ textAlign: 'center', padding: '15px' }}>
            No announcements yet
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

<div className="section-header">
  <h2 className="page-title">Educational Media Display</h2>

  <button className="add-btn" onClick={() => setShowMediaModal(true)}>
    + Upload Video
  </button>
</div>

{showMediaModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <form
        onSubmit={(e) => {
          e.preventDefault()

          if (!videoFile) return

          handleUpload()
          setShowMediaModal(false)
        }}
        className="threshold-box"
      >

        <div className="modal-header">
          <h3>Upload Video</h3>
          <button
            type="button"
            className="close-btn"
            onClick={() => setShowMediaModal(false)}
          >
            ✕
          </button>
        </div>

        <div className="label-row">
          <label>Choose File *</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            required
          />
        </div>

        <div className="action-row">
          <button className="add-btn">Upload</button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => setShowMediaModal(false)}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  </div>
)}

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
export default WebBulletinBoard