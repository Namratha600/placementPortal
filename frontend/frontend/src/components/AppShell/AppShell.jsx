import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import NotificationBell from '../NotificationBell'
import './AppShell.css'

/**
 * AppShell — persistent sidebar + topbar wrapper for logged-in pages.
 * Pure layout/presentation. It reads the role from useAuth() to decide which
 * nav links to show, and uses the existing logout() from AuthContext.
 *
 * Usage: wrap a page's content:
 *   <AppShell title="Dashboard"><...page...></AppShell>
 *
 * `showBell` (default true for students) shows the notification bell in the topbar.
 */

// Small inline icon set (professional line icons, no external dependency)
const icons = {
  grid: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  search: 'M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
  briefcase: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  building: 'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9h.01M9 13h.01M9 17h.01',
  records: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6M8 13h8M8 17h6',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 2-10 7L2 6',
}

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const STUDENT_NAV = [
  { to: '/student/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/company-search', label: 'Companies', icon: 'search' },
  { to: '/student/profile', label: 'My Profile', icon: 'user' },
  { to: '/student/details', label: 'My Details', icon: 'user' },
]

// Super-admin sees everything; regular admin sees the shared subset.
const ADMIN_NAV_SUPER = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/admin/opportunities', label: 'Opportunities', icon: 'briefcase' },
  { to: '/admin/companies', label: 'Companies', icon: 'building' },
  { to: '/admin/placement-records', label: 'Placement Records', icon: 'records' },
  { to: '/admin/students', label: 'Student Search', icon: 'search' },
  { to: '/admin/cgpa-upload', label: 'Upload CGPA', icon: 'upload' },
  { to: '/admin/notifications', label: 'Send Notification', icon: 'bell' },
  { to: '/admin/resume-reminders', label: 'Resume Reminders', icon: 'mail' },
  { to: '/admin/manage-admins', label: 'Manage Admins', icon: 'shield' },
]
const ADMIN_NAV_REGULAR = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'grid' },
]

export default function AppShell({ title, children, showBell }) {
  const { role, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isStudent = role === 'student'
  const nav = isStudent
    ? STUDENT_NAV
    : (role === 'super_admin' ? ADMIN_NAV_SUPER : ADMIN_NAV_REGULAR)

  const bell = showBell ?? isStudent

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className={`shell-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="shell-brand">
          <div className="shell-logo">CP</div>
          <div className="shell-brand-text">
            <span className="shell-brand-name">Placement Portal</span>
            <span className="shell-brand-sub">{isStudent ? 'Student' : (role === 'super_admin' ? 'Super Admin' : 'Admin')}</span>
          </div>
        </div>

        <nav className="shell-nav">
          {nav.map((item) => {
            const active = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`shell-nav-item ${active ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon d={icons[item.icon]} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <button className="shell-logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span>Log out</span>
        </button>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && <div className="shell-backdrop" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="shell-main">
        <header className="shell-topbar">
          <button className="shell-hamburger" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="shell-title">{title}</h1>
          <div className="shell-topbar-right">
            {bell && <NotificationBell />}
          </div>
        </header>

        <main className="shell-content">
          {children}
        </main>
      </div>
    </div>
  )
}