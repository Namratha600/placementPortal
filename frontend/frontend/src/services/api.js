import axios from 'axios'

// Single shared axios instance so the base URL is defined in exactly one
// place. Every service/page imports this instead of calling axios directly
// — if the backend URL ever changes (e.g. deploying to production), only
// this file needs updating.
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Automatically attaches "Authorization: Bearer <token>" to every request
// if the user is logged in. This is the first point where the frontend
// calls an authenticated endpoint (Manage Admins), so this didn't exist
// until now — public endpoints (login, register, set-password) simply
// ignore the header since their routes don't require it.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api