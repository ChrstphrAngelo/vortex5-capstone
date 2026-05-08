import { useEffect, useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'

// Components
import AqiDetails from '../components/AqiDetails'

const Home = () => {
  const [Aqi, setAqi] = useState(null)
  const { user } = useAuthContext()

  const canSeeAqi = user && ['admin', 'staff'].includes(user.role)
  const canSeeWebUser = user && ['staff'].includes(user.role)
  const canSeeWebAdmin = user && ['admin'].includes(user.role)

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      try {
        const aqiRes = await fetch('/api/aqi', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
        const aqiJson = await aqiRes.json()
        if (aqiRes.ok && aqiJson.length > 0) {
          const latestAqi = aqiJson.reduce((latest, current) =>
            new Date(current.createdAt) > new Date(latest.createdAt)
              ? current
              : latest
          )
          setAqi([latestAqi])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [user])



  return (
    <div className="home">


      {canSeeWebUser && (
      <div className="section-header">
        <h2 className="page-title">Web User</h2>
      </div>
      )}

      {canSeeWebAdmin && (
      <div className="section-header">
        <h2 className="page-title">Web Admin</h2>
      </div>
      )}
      
      {canSeeAqi && (
        <div className="Aqi">
      <div className="section-header">
        <h2 className="page-title">AQI</h2>
      </div>
          {Aqi && Aqi.map(aqi => <AqiDetails key={aqi._id} aqi={aqi} />)}
        </div>
      )}

    

    </div>
  )
}

export default Home