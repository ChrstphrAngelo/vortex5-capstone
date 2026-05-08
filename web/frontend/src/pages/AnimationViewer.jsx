import { useEffect, useState } from 'react'

const AnimationViewer = () => {
  const [media, setMedia] = useState([])

  useEffect(() => {
    const fetchMedia = async () => {
      const res = await fetch('/api/media')
      const json = await res.json()
      if (res.ok) setMedia(json)
    }

    fetchMedia()
  }, [])

  return (
    <div>
      <div className="section-header">
        <h2 className="page-title">Animation Viewer</h2>
      </div>

      <div className="viewer-grid">
        {media.map((m) => (
          <div key={m._id} className="viewer-card">
            <h3 className="video-title">{m.title}</h3>

            <video controls className="viewer-video">
              <source
                src={`http://localhost:4000${m.videoUrl}`}
                type="video/mp4"
              />
            </video>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnimationViewer