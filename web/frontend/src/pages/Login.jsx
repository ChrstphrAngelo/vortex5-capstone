import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useLogin } from '../hooks/useLogin'
import bewairLogo from '../assets/bewair_logo_black.png'

const Login = () => {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const { login, error, isLoading } = useLogin()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Brand header ─────────────────────────────── */}
        <div className="auth-brand">
          <img src={bewairLogo} alt="BewAir logo" className="auth-logo-img" />
          <div>
            <div className="auth-brand-name">BewAir</div>
          </div>
        </div>

        <h2 className="auth-heading">Welcome back</h2>
        <p className="auth-subheading">
          Log in to check classroom air quality, alerts, and device status.
        </p>

        {/* ── Form ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              placeholder="teacher@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-pw-wrap">
              <input
                className="auth-input"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" disabled={isLoading}>
            {isLoading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        {/* ── Footer links ─────────────────────────────── */}
        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/signup">Create account</Link>
        </p>
        <p className="auth-back-link">
          <Link to="/landingpage">← Back to Landing Page</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
