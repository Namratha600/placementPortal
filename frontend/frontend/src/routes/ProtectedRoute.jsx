import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Wraps a page element and enforces two things before rendering it:
 * 1. The user is logged in at all (has a token).
 * 2. If `allowedRole` is given, the user's role matches it.
 *
 * Usage:
 *   <ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>
 */
function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    // Not logged in at all — send to the login chooser so they can pick
    // student or admin, rather than assuming student.
    return <Navigate to="/login" replace />
  }

  if (allowedRole && role !== allowedRole) {
    // Logged in, but as the wrong role (e.g. a student trying to reach
    // /admin/dashboard directly by typing the URL).
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute