import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../auth.css'

function StudentLogin() {
  const [registerNumber, setRegisterNumber] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')

    if (!registerNumber.trim() || !password) {
      setApiError('Enter your register number and password.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.post('/auth/student/login', {
        register_number: registerNumber,
        password,
      })

      login(response.data.access_token, response.data.role)
      navigate('/student/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      setApiError(typeof detail === 'string' ? detail : 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">CP</div>
          <span className="auth-brand-name">Campus Placement Portal</span>
        </div>

        <div className="auth-head">
          <h1 className="auth-title">Student login</h1>
          <span className="badge badge-accent">Student</span>
        </div>
        <p className="auth-sub">Sign in to browse drives and track applications.</p>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {apiError && <p className="auth-error">{apiError}</p>}

          <label className="auth-field">
            <span>Register number</span>
            <input
              type="text"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              placeholder="e.g. 24B01A1286"
              autoComplete="username"
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="auth-footer">
          <span>
            Don't have an account?{' '}
            <Link to="/register/student">Sign up</Link>
          </span>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </div>
    </div>
  )
}

export default StudentLogin