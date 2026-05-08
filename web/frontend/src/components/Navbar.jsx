import { NavLink } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { useLogout } from "../hooks/useLogout"
import { useState, useEffect  } from 'react'
import { useLocation } from 'react-router-dom'

import {
  LayoutDashboard,
  BarChart3,
  School,
  Settings,
  Users,
  FileText,
  LogOut,
  Bell,
  Wifi,
  UserCircle,
  ClipboardList,
  Video,
  LogIn, 
  UserPlus,
  Gauge, 
  Megaphone
} from 'lucide-react'

// Import the logo
import bewAirLogo from '../assets/bewAirLogo.png'

const Navbar = () => {
  const { user } = useAuthContext()
  const { logout } = useLogout()

  const handleLogout = () => {
        logout()
    }

  const location = useLocation()
  const isConfigActive = location.pathname.startsWith('/configuration')

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src={bewAirLogo} alt="BewAir Logo" className="sidebar-logo" />
          <h2>BewAir</h2>
        </div>
        <span>School Air Monitor</span>
      </div>

      <nav className="sidebar-links">
        {user && (
          <>
            {user.role === 'admin' && (
              <>
                <NavLink to="/" end>
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/analytics">
                    <BarChart3 size={18} />
                    <span>Analytics</span>
                    </NavLink>

                    <NavLink to="/classroomrecords">
                    <School size={18} />
                    <span>Classroom Records</span>
                    </NavLink>

                    <div className={`sidebar-group ${isConfigActive ? 'active-parent' : ''}`}>
                      <div className="sidebar-parent">
                        <Settings size={18} />
                        <span>Configuration</span>
                      </div>

                      <div className="sidebar-submenu-wrapper">
                        <div className="sidebar-submenu">
                          <NavLink to="/configuration/Thresholds">
                            <Gauge size={16} />
                            <span>Thresholds</span>
                          </NavLink>

                          <NavLink to="/configuration/WebBulletinBoard">
                            <Megaphone size={16} />
                            <span>Bulletin Board</span>
                          </NavLink>
                        </div>
                      </div>
                    </div>

                    <NavLink to="/usermanagement">
                    <Users size={18} />
                    <span>User Management</span>
                    </NavLink>

                    <NavLink to="/auditlog">
                    <FileText size={18} />
                    <span>Audit Log</span>
                    </NavLink>
              </>
            )}

            {user.role === 'staff' && (
              <>
                <NavLink to="/alerts-and-notifications">
                  <Bell size={18} />
                  <span>Alerts</span>
                </NavLink>

                <NavLink to="/connect-sensor">
                  <Wifi size={18} />
                  <span>Connect Sensor</span>
                </NavLink>

                <NavLink to="/profile">
                  <UserCircle size={18} />
                  <span>Profile</span>
                </NavLink>

                <NavLink to="/bulletin-board">
                  <ClipboardList size={18} />
                  <span>Bulletin Board</span>
                </NavLink>

                <NavLink to="/animation-viewer">
                  <Video size={18} />
                  <span>Animation Viewer</span>
                </NavLink>
              </>
            )}
            
          
          
          </>
        )}

        {!user && (
          <>
            <NavLink to="/login">
              <LogIn size={18} />
              <span>Login</span>
            </NavLink>

            <NavLink to="/signup">
              <UserPlus size={18} />
              <span>Signup</span>
            </NavLink>
          </>
        )}
      </nav>

      <button onClick={handleLogout} className="sidebar-logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
    </div>
  )
}

export default Navbar