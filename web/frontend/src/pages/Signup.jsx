import { useState } from 'react'
import { useSignup } from "../hooks/useSignup"
import { Link } from 'react-router-dom'

const Signup = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const {signup, error, isLoading} = useSignup()

    const handleSubmit = async (e) => {
        e.preventDefault()
        await signup(email, password, firstName, lastName)
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

            <button disabled={isLoading}>Sign up</button>

            {error && <div className='error'>{error}</div>}

            <div className="auth-footer">
                <p>
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
                <Link to="/landingpage" className="back-to-home">← Back to Landing Page</Link>
            </div>
        </form>
    )
}

export default Signup
