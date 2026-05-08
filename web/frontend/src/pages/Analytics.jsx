import { useEffect, useState } from 'react'
import AqiDetails from '../components/AqiDetails'
import { useAuthContext } from '../hooks/useAuthContext'

const Analytics = () => {
  const [latestAqi, setLatestAqi] = useState(null)
  const { user } = useAuthContext()

  useEffect(() => {
    if (!user) return
    const fetchLatestAqi = async () => {
      try {
        const res = await fetch('/api/aqi', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
        const data = await res.json()
        if (res.ok && data.length > 0) {
          const newest = data.reduce((latest, current) =>
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
          )
          setLatestAqi([newest])
        }
      } catch (error) {
        console.error('Error fetching AQI:', error)
      }
    }

    fetchLatestAqi()
  }, [user])

  return (
    <div>
      <div className="section-header">
        <h2 className="page-title">Air Quality Index</h2>
      </div>

      {/* Latest AQI Box */}
      {latestAqi && latestAqi.map(aqi => <AqiDetails key={aqi._id} aqi={aqi} />)}
      {!latestAqi && <p>No AQI data available.</p>}

      <div className="section-header">
        <h2 className="page-title">Analytics</h2>
      </div>

      <h3><center>Daily AQI data</center></h3>
      {/* Placeholder for Line Chart */}
      <div 
        style={{
          marginTop: '30px',
          height: '250px',
          border: '2px dashed #999',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#999',
          fontSize: '1.2rem'
        }}
      >
        Line Chart Placeholder
      </div>

      <h4> <center>description: analytics</center></h4>
<hr></hr>
        <h3><center>Monthly AQI data</center></h3>
      {/* Placeholder for Doughnut Chart */}
      <div
        style={{
          marginTop: '20px',
          height: '250px',
          border: '2px dashed #999',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#999',
          fontSize: '1.2rem',
          width: '250px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        Doughnut Chart Placeholder
      </div>
       <h4> <center>description: analytics</center></h4>

    </div>
  )
}

export default Analytics