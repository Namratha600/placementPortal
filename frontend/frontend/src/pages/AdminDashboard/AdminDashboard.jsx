import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import AppShell from '../../components/AppShell/AppShell.jsx'
import './AdminDashboard.css'

/**
 * AdminDashboard — landing page for admins. Redesign only: same role logic
 * (super_admin sees the management actions), now presented as quick-action
 * cards inside the shared AppShell. No API/behaviour changes.
 */
function ActionIcon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  )
}

const SUPER_ACTIONS = [
  { to: '/admin/opportunities', title: 'Opportunities', desc: 'Post & manage drives', icon: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2' },
  { to: '/admin/companies', title: 'Companies', desc: 'Manage company profiles', icon: 'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4' },
  { to: '/admin/placement-records', title: 'Placement Records', desc: 'Upload & view records', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6' },
  { to: '/admin/students', title: 'Student Search', desc: 'Look up students & resumes', icon: 'M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z' },
  { to: '/admin/cgpa-upload', title: 'Upload CGPA', desc: 'Bulk-update CGPAs', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12' },
  { to: '/admin/notifications', title: 'Send Notification', desc: 'Message students', icon: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0' },
  { to: '/admin/notification-history', title: 'Notification History', desc: 'View sent notifications & analytics', icon: 'M12 8v4l3 2M12 3a9 9 0 1 0 9 9' },
  { to: '/admin/resume-reminders', title: 'Resume Reminders', desc: 'Email resume reminders', icon: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 2-10 7L2 6' },
  { to: '/admin/manage-admins', title: 'Manage Admins', desc: 'Invite & manage admins', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z' },
]

function AdminDashboard() {
  const { role } = useAuth()
  const isSuper = role === 'super_admin'
  return (
    <AppShell title="Dashboard">
      <div className="ad-hero card">
        <div>
          <h2 className="ad-hero-title">Welcome back</h2>
          <p className="ad-hero-sub muted">
            {isSuper
              ? 'Manage drives, companies, records and students from one place.'
              : 'Your placement cell workspace.'}
          </p>
        </div>
        <span className="badge badge-accent">{isSuper ? 'Super Admin' : 'Admin'}</span>
      </div>
      {isSuper ? (
        <div className="ad-actions">
          {SUPER_ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className="ad-action">
              <div className="ad-action-icon"><ActionIcon d={a.icon} /></div>
              <div className="ad-action-text">
                <span className="ad-action-title">{a.title}</span>
                <span className="ad-action-desc">{a.desc}</span>
              </div>
              <span className="ad-action-arrow">→</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card ad-empty">
          <p className="muted">
            You're signed in as an administrator. Additional management tools are
            available to super administrators.
          </p>
        </div>
      )}
    </AppShell>
  )
}

export default AdminDashboard