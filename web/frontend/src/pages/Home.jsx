import { useAuthContext } from '../hooks/useAuthContext'
import AdminDashboard from './AdminDashboard'
import StaffDeviceList from './StaffDeviceList'

// Role-based home: admins get the full dashboard, staff (teachers) get the
// simple device list. Routes from "/" so the sidebar Dashboard link works for both.
const Home = () => {
  const { user } = useAuthContext()

  if (!user) return null
  if (user.role === 'admin') return <AdminDashboard />
  return <StaffDeviceList />
}

export default Home
