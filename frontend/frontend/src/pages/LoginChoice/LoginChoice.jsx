import { Link } from 'react-router-dom'
import './LoginChoice.css'

/**
 * Entry point for the whole app: lets the visitor pick which login flow
 * they need before landing on either the student or admin login form.
 * No auth logic here — purely navigational. (Redesign: styling only.)
 */
function LoginChoice() {
  return (
    <div className="choice-page">
      <div className="choice-card">
        <div className="choice-brand">
          <div className="choice-logo">CP</div>
          <span className="choice-eyebrow">Campus Placement Portal</span>
        </div>

        <h1 className="choice-title">Welcome back</h1>
        <p className="choice-sub">Sign in to continue to your portal</p>

        <div className="choice-options">
          <Link to="/login/student" className="choice-option">
            <div className="choice-option-icon" aria-hidden="true">
              {/* graduation cap */}
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/>
              </svg>
            </div>
            <div className="choice-option-text">
              <span className="choice-option-label">Student</span>
              <span className="choice-option-desc">Browse drives, apply & track</span>
            </div>
            <span className="choice-option-arrow" aria-hidden="true">→</span>
          </Link>

          <Link to="/login/admin" className="choice-option">
            <div className="choice-option-icon" aria-hidden="true">
              {/* shield */}
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
              </svg>
            </div>
            <div className="choice-option-text">
              <span className="choice-option-label">Administrator</span>
              <span className="choice-option-desc">Manage the placement cell</span>
            </div>
            <span className="choice-option-arrow" aria-hidden="true">→</span>
          </Link>
        </div>

        <p className="choice-footer">Placement Cell · SVECW</p>
      </div>
    </div>
  )
}

export default LoginChoice