import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../../services/api.js'
import '../auth.css'

function SetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    if (!token) {
      setApiError('This link is missing a valid invitation token.')
      return
    }
    setIsSubmitting(true)
    try {
      const response = await api.post('/admin/set-password', {
        token,
        password,
        confirm_password: confirmPassword,
      })
      setSuccessMessage(response.data.message)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setApiError(detail.map((d) => d.msg).join(' '))
      } else {
        setApiError(detail || 'Could not set password. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo">CP</div>
            <span className="auth-brand-name">Campus Placement Portal</span>
          </div>
          <p className="auth-error">
            This link is missing an invitation token. Please use the exact
            link from your invitation email.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">CP</div>
          <span className="auth-brand-name">Campus Placement Portal</span>
        </div>

        <div className="auth-head">
          <h1 className="auth-title">Set your password</h1>
          <span className="badge auth-admin-badge">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
            </svg>
            Administrator
          </span>
        </div>
        <p className="auth-sub">Choose a password to activate your admin account.</p>

        {successMessage ? (
          <>
            <p className="auth-success">{successMessage}</p>
            <div className="auth-footer">
              <Link to="/login/admin">Go to Admin Login →</Link>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {apiError && <p className="auth-error">{apiError}</p>}

            <label className="auth-field">
              <span>Password</span>
              <input type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </label>

            <label className="auth-field">
              <span>Confirm password</span>
              <input type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            </label>

            <button type="submit" className="auth-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Setting password…' : 'Set password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default SetPassword