import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useSignup } from '../hooks/useSignup'
import bewairLogo from '../assets/bewair_logo_black.png'

const Signup = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const { signup, error, isLoading } = useSignup()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await signup(email, password, firstName, lastName)
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

        <h2 className="auth-heading">Create account</h2>
        <p className="auth-subheading">
          Join your school's air quality monitoring platform.
        </p>

        {/* ── Form ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="auth-form">

          {/* Name row */}
          <div className="auth-row">
            <div className="auth-field">
              <label className="auth-label">First name</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Last name</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Dela Cruz"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

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
                placeholder="Create a strong password"
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
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {/* ── Footer links ─────────────────────────────── */}
        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
        <p className="auth-back-link">
          <Link to="/landingpage">← Back to Landing Page</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
