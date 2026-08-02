import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../auth.css'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')

    if (!email.trim() || !password) {
      setApiError('Enter your email and password.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.post('/auth/admin/login', {
        email,
        password,
      })

      login(response.data.access_token, response.data.role)
      navigate('/admin/dashboard')
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
          <h1 className="auth-title">Admin login</h1>
          <span className="badge auth-admin-badge">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
            </svg>
            Administrator
          </span>
        </div>
        <p className="auth-sub">Sign in to manage the placement cell.</p>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {apiError && <p className="auth-error">{apiError}</p>}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@svecw.edu.in"
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
      </div>
    </div>
  )
}

export default AdminLogin