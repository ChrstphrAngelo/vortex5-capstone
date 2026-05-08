import { useState } from 'react'
import { useSignup } from "../hooks/useSignup"
import { useNavigate, Link } from 'react-router-dom'  // Add Link to imports

const Signup = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [role, setRole] = useState('')
    const {signup, error, isLoading} = useSignup()
    const navigate = useNavigate() 

    const handleSubmit = async (e) => {
        e.preventDefault()
        await signup(email, password, firstName, lastName, role)
    }

    return (
        <form className="signup" onSubmit={handleSubmit}>
            <h3>Sign up</h3>

            <label>First Name:</label>
            <input
                type="text"
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
            />
            
            <label>Last Name:</label>
            <input
                type="text"
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
            />

            <label>Email:</label>
            <input 
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
            />

            <label>Password:</label>
            <input 
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
            />

            <label>Role:</label>
            <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
            >
                <option value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
            </select>
            <button disabled={isLoading}>Sign up</button>

            {error && <div className='error'>{error}</div>}

            {/* Link to Landing Page */}
            <div className="auth-footer">
                <Link to="/landingpage" className="back-to-home">← Back to Landing Page</Link>
            </div>
        </form>
    )
}

export default Signup