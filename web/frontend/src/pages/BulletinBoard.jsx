// BulletinBoard.jsx
import { useEffect, useState, useRef } from 'react'
import AqiDetails from '../components/AqiDetails'

const BulletinBoard = () => {
  // State for videos (slideshow)
  const [mediaList, setMediaList] = useState([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const videoRef = useRef(null)
  const boardRef = useRef(null)

  // State for announcements
  const [announcements, setAnnouncements] = useState([])
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0)

  // State for AQI
  const [aqiData, setAqiData] = useState(null)

  // State for current time
  const [currentTime, setCurrentTime] = useState(new Date())

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Long message as scrolling ticker
  const [longMessage, setLongMessage] = useState("🌿 Welcome to the Environmental Bulletin Board System • Stay informed about air quality • Watch educational videos • Read important announcements • Real-time AQI monitoring • Together for a better future • ")

  // Fetch media
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch('/api/media')
        const json = await res.json()
        if (res.ok && json.length > 0) {
          setMediaList(json)
        }
      } catch (error) {
        console.error('Error fetching media:', error)
      }
    }
    fetchMedia()
  }, [])

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements')
        const json = await res.json()
        if (res.ok) {
          setAnnouncements(json)
        }
      } catch (error) {
        console.error('Error fetching announcements:', error)
      }
    }
    fetchAnnouncements()
  }, [])

  // Fetch latest AQI data
  useEffect(() => {
    const fetchAqi = async () => {
      try {
        const res = await fetch('/api/aqi')
        const json = await res.json()
        if (res.ok && json.length > 0) {
          const latest = json.reduce((latest, current) =>
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
          )
          setAqiData(latest)
        }
      } catch (error) {
        console.error('Error fetching AQI:', error)
      }
    }
    fetchAqi()
    const interval = setInterval(fetchAqi, 30000)
    return () => clearInterval(interval)
  }, [])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Rotate announcements every 5 seconds
  useEffect(() => {
    if (announcements.length <= 1) return
    const interval = setInterval(() => {
      setCurrentAnnouncementIndex(prev => (prev + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [announcements.length])

  // Handle video ended event
  const handleVideoEnded = () => {
    if (mediaList.length > 0 && isPlaying) {
      setCurrentVideoIndex(prev => (prev + 1) % mediaList.length)
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  const handlePause = () => {
    setIsPlaying(false)
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  const enterFullscreen = () => {
    const element = boardRef.current
    if (element) {
      if (element.requestFullscreen) {
        element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen()
      }
    }
  }

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      enterFullscreen()
    } else {
      exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [])

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getVideoUrl = (videoUrl) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    return `${baseUrl}${videoUrl}`
  }

  const hasVideos = mediaList.length > 0
  const currentVideo = hasVideos ? mediaList[currentVideoIndex] : null
  const currentAnnouncement = announcements.length > 0 ? announcements[currentAnnouncementIndex] : null

  return (
    <div className="bulletin-board-container">
      {/* Control Bar */}
      <div className="bb-control-bar">
        <div className="control-group">
          {isPlaying ? (
            <button className="control-btn" onClick={handlePause}>
              ⏸ Pause
            </button>
          ) : (
            <button className="control-btn play-btn" onClick={handlePlay}>
              ▶ Play
            </button>
          )}
          <button className="control-btn fullscreen-btn" onClick={toggleFullscreen}>
            ⛶ Fullscreen
          </button>
        </div>
        <div className="video-status">
          {hasVideos && <span>Video {currentVideoIndex + 1} of {mediaList.length}</span>}
        </div>
      </div>

      {/* Bulletin Board - EXACTLY FOLLOWING YOUR LAYOUT IMAGE */}
      <div className={`bulletin-board ${isFullscreen ? 'fullscreen-mode' : ''}`} ref={boardRef}>
        {isFullscreen && (
          <button className="exit-fullscreen-btn" onClick={toggleFullscreen}>
            ✕ Exit Fullscreen
          </button>
        )}

        {/* LEFT COLUMN - Video (BIGGER) + TIME + LONG MESSAGE below it */}
        <div className="bb-left">
          {/* Video Section - BIGGER */}
          <div className="bb-card video-card">
            <h2 className="bb-title">Animations</h2>
            <div className="video-wrapper">
              {hasVideos ? (
                <video
                  key={currentVideo._id}
                  ref={videoRef}
                  src={getVideoUrl(currentVideo.videoUrl)}
                  className="bb-video"
                  autoPlay={isPlaying}
                  onEnded={handleVideoEnded}
                  controls={false}
                  playsInline
                />
              ) : (
                <div className="video-placeholder">
                  <p>No videos available</p>
                </div>
              )}
            </div>
            {hasVideos && <div className="video-title">{currentVideo.title}</div>}
          </div>

          {/* TIME and LONG MESSAGE side by side BELOW the video */}
          <div className="bb-bottom-row-left">
            <div className="time-card">
              <h2 className="bb-title">TIME</h2>
              <div className="time-display">
                <div className="current-time">{formatTime()}</div>
                <div className="current-date">{formatDate()}</div>
              </div>
            </div>

            <div className="ticker-card">
              <h2 className="bb-title">LONG MESSAGE</h2>
              <div className="ticker-container">
                <div className="ticker-content">
                  {longMessage}
                  {longMessage}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Announcements and AQI */}
        <div className="bb-right">
          {/* ANNOUNCEMENTS */}
          <div className="bb-card announcements-card">
            <h2 className="bb-title">ANNOUNCEMENTS</h2>
            <div className="announcements-content">
              {announcements.length > 0 ? (
                <>
                  <h3 className="announcement-title">{currentAnnouncement?.title}</h3>
                  <div className="announcement-meta">
                    {currentAnnouncement?.date && <span>📅 {currentAnnouncement.date}</span>}
                    {currentAnnouncement?.time && <span>🕐 {currentAnnouncement.time}</span>}
                  </div>
                  {currentAnnouncement?.description && (
                    <p className="announcement-description">{currentAnnouncement.description}</p>
                  )}
                  {announcements.length > 1 && (
                    <div className="announcement-dots">
                      {announcements.map((_, idx) => (
                        <span key={idx} className={`dot ${idx === currentAnnouncementIndex ? 'active' : ''}`} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="empty-message">No announcements available</p>
              )}
            </div>
          </div>

          {/* AQI DISPLAY */}
          <div className="bb-card aqi-card-right">
            <h2 className="bb-title">AQI DISPLAY</h2>
            <div className="aqi-content">
              {aqiData ? (
                <AqiDetails aqi={aqiData} />
              ) : (
                <p className="empty-message">Waiting for AQI data...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulletinBoard