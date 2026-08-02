import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api.js'
import '../auth.css'
import './StudentRegister.css'

// Client-side mirrors of the backend's validation rules
// (app/utils/validators.py). Keeping these in sync means the user sees an
// error instantly instead of waiting on a round-trip to the server for
// something we can check locally. The backend re-validates everything
// regardless — this is just for UX.
// Format: YY (year) + B01A (constant) + BB (branch code) + XX (roll, alphanumeric)
const VALID_BRANCH_CODES = ['02', '03', '04', '05', '12', '42', '45', '46']
const REGISTER_NUMBER_REGEX = /^(\d{2})B01A(\d{2})([A-Z0-9]{2})$/
const PHONE_REGEX = /^[6-9]\d{9}$/

function getRegisterNumberError(rawValue) {
  const value = rawValue.trim().toUpperCase()
  const match = value.match(REGISTER_NUMBER_REGEX)
  if (!match) {
    return 'Format should be like 24B01A1286 (YY + B01A + branch code + roll).'
  }
  const branchCode = match[2]
  if (!VALID_BRANCH_CODES.includes(branchCode)) {
    return `'${branchCode}' is not a recognized branch code.`
  }
  return null
}

function getGeneratedEmailPreview(rawValue) {
  const value = rawValue.trim()
  if (getRegisterNumberError(value)) return ''
  return `${value.toLowerCase()}@svecw.edu.in`
}

function validateForm(form) {
  const errors = {}

  if (form.fullName.trim().length < 2) {
    errors.fullName = 'Enter your full name.'
  }
  const registerNumberError = getRegisterNumberError(form.registerNumber)
  if (registerNumberError) {
    errors.registerNumber = registerNumberError
  }
  if (!PHONE_REGEX.test(form.phone.trim())) {
    errors.phone = 'Enter a valid 10-digit mobile number.'
  }
  if (form.password.length < 8) {
    errors.password = 'At least 8 characters.'
  } else if (
    !/[A-Z]/.test(form.password) ||
    !/[a-z]/.test(form.password) ||
    !/\d/.test(form.password)
  ) {
    errors.password = 'Include an uppercase letter, a lowercase letter, and a number.'
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

const initialForm = {
  fullName: '',
  registerNumber: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

function StudentRegister() {
  // step 1 = enter details, step 2 = enter OTP
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [otp, setOtp] = useState('')
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleDetailsSubmit(e) {
    e.preventDefault()
    const validationErrors = validateForm(form)
    setErrors(validationErrors)
    setApiError('')

    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const response = await api.post('/auth/student/register', {
        full_name: form.fullName,
        register_number: form.registerNumber,
        phone: form.phone,
        password: form.password,
        confirm_password: form.confirmPassword,
      })
      setGeneratedEmail(response.data.email)
      setStep(2)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setApiError(detail.map((d) => d.msg).join(' '))
      } else {
        setApiError(detail || 'Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault()
    setApiError('')
    setIsSubmitting(true)
    try {
      const response = await api.post('/auth/student/verify-otp', {
        register_number: form.registerNumber,
        otp,
      })
      setSuccessMessage(`Account created for ${response.data.full_name}. You can now log in.`)
    } catch (err) {
      const detail = err.response?.data?.detail
      setApiError(typeof detail === 'string' ? detail : 'Verification failed. Please try again.')
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
          <h1 className="auth-title">Create your account</h1>
          <span className="badge badge-accent">Student</span>
        </div>
        <p className="auth-sub">
          {step === 1 ? 'Enter your details to get started.' : 'Verify your email to finish.'}
        </p>

        <div className="auth-steps" aria-hidden="true">
          <div className={`auth-step-dot ${step >= 1 ? 'active' : ''}`}><span>1</span></div>
          <div className={`auth-step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`auth-step-dot ${step >= 2 ? 'active' : ''}`}><span>2</span></div>
        </div>

        {step === 1 && (
          <form onSubmit={handleDetailsSubmit} noValidate className="auth-form">
            {apiError && <p className="auth-error">{apiError}</p>}

            <label className="auth-field">
              <span>Full name</span>
              <input
                type="text" name="fullName" value={form.fullName}
                onChange={handleChange} placeholder="e.g. Varshini K" autoComplete="name"
              />
              {errors.fullName && <p className="auth-field-error">{errors.fullName}</p>}
            </label>

            <label className="auth-field">
              <span>Register number</span>
              <input
                type="text" name="registerNumber" value={form.registerNumber}
                onChange={handleChange} placeholder="e.g. 24B01A1286"
              />
              {errors.registerNumber && <p className="auth-field-error">{errors.registerNumber}</p>}
            </label>

            {getGeneratedEmailPreview(form.registerNumber) && (
              <label className="auth-field">
                <span>College email</span>
                <input
                  type="text" value={getGeneratedEmailPreview(form.registerNumber)}
                  readOnly className="auth-readonly"
                />
                <p className="auth-field-hint">Generated automatically from your register number.</p>
              </label>
            )}

            <label className="auth-field">
              <span>Phone number</span>
              <input
                type="tel" name="phone" value={form.phone}
                onChange={handleChange} placeholder="10-digit mobile number" autoComplete="tel"
              />
              {errors.phone && <p className="auth-field-error">{errors.phone}</p>}
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password" name="password" value={form.password}
                onChange={handleChange} autoComplete="new-password"
              />
              {errors.password && <p className="auth-field-error">{errors.password}</p>}
            </label>

            <label className="auth-field">
              <span>Confirm password</span>
              <input
                type="password" name="confirmPassword" value={form.confirmPassword}
                onChange={handleChange} autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="auth-field-error">{errors.confirmPassword}</p>}
            </label>

            <button type="submit" className="auth-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send verification code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} noValidate className="auth-form">
            {successMessage ? (
              <p className="auth-success">{successMessage}</p>
            ) : (
              <>
                {apiError && <p className="auth-error">{apiError}</p>}
                <p className="auth-otp-copy">
                  A 6-digit code was sent to <strong>{generatedEmail}</strong>.
                </p>
                <label className="auth-field">
                  <span>Verification code</span>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000"
                  />
                </label>
                <button type="submit" className="auth-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Verifying…' : 'Verify and create account'}
                </button>
                <button type="button" className="auth-text-btn" onClick={() => setStep(1)}>
                  ← Back to details
                </button>
              </>
            )}
          </form>
        )}

        <div className="auth-footer">
          <span>Already have an account? <Link to="/login/student">Log in</Link></span>
        </div>
      </div>
    </div>
  )
}

export default StudentRegister