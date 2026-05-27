import { useAuthContext } from '../hooks/useAuthContext'

const Header = () => {

  const { user } = useAuthContext()

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="header">
      <div className="header-left">
        <h1>Air Quality Monitoring System</h1>
        <p>Real-time environmental monitoring</p>
      </div>

      <div className="header-right">
        <span>{today}</span>
        {user && (
          <span>Logged in as : {user.email}</span>
        )}
      </div>
    </div>
  )
}

export default Header