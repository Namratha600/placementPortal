import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Reads whatever's already in localStorage on first load, so refreshing
// the page doesn't log the user out. This is the single source of truth
// for "who is logged in" across the whole app.
function getInitialAuth() {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  return token && role ? { token, role } : { token: null, role: null }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getInitialAuth)

  function login(token, role) {
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    setAuth({ token, role })
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setAuth({ token: null, role: null })
  }

  const value = {
    token: auth.token,
    role: auth.role,
    isAuthenticated: Boolean(auth.token),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook so components just call useAuth() instead of importing
// useContext + AuthContext separately everywhere.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}