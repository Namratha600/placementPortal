import { useEffect, useState } from 'react'
import api from '../../services/api.js'
import AppShell from '../../components/AppShell/AppShell.jsx'
import './ManageAdmins.css'

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
}

const STATUS_BADGE = {
  pending: 'badge-warning',
  accepted: 'badge-success',
  expired: 'badge-danger',
}

function ManageAdmins() {
  const [admins, setAdmins] = useState([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [listError, setListError] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  async function loadAdmins() {
    setIsLoadingList(true)
    setListError('')
    try {
      const response = await api.get('/admin/list')
      setAdmins(response.data)
    } catch (err) {
      const detail = err.response?.data?.detail
      setListError(typeof detail === 'string' ? detail : 'Could not load admins.')
    } finally {
      setIsLoadingList(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  async function handleInviteSubmit(e) {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    if (fullName.trim().length < 2) {
      setInviteError('Enter a full name.')
      return
    }
    if (!email.trim()) {
      setInviteError('Enter an email address.')
      return
    }
    setIsInviting(true)
    try {
      const response = await api.post('/admin/invite', {
        full_name: fullName,
        email,
      })
      setInviteSuccess(response.data.message)
      setFullName('')
      setEmail('')
      loadAdmins()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setInviteError(detail.map((d) => d.msg).join(' '))
      } else {
        setInviteError(detail || 'Could not send invitation. Please try again.')
      }
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <AppShell title="Manage Admins">
      <div className="ma-head">
        <p className="muted ma-sub">Invite administrators and track their invitation status.</p>
        <button className="btn btn-primary" onClick={() => setShowInviteForm((prev) => !prev)}>
          {showInviteForm ? 'Cancel' : '+ Invite Admin'}
        </button>
      </div>

      {showInviteForm && (
        <form className="card ma-form" onSubmit={handleInviteSubmit} noValidate>
          {inviteError && <p className="alert alert-error">{inviteError}</p>}
          {inviteSuccess && <p className="alert alert-success">{inviteSuccess}</p>}

          <div className="ma-field">
            <label className="field-label">Full name</label>
            <input className="input" type="text" value={fullName}
              onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
          </div>

          <div className="ma-field">
            <label className="field-label">Email address</label>
            <input className="input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="admin.name@svecw.edu.in" />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isInviting}>
            {isInviting ? 'Sending invite…' : 'Send Invitation'}
          </button>
        </form>
      )}

      <div className="ma-list">
        {isLoadingList && <p className="muted">Loading admins…</p>}
        {listError && <p className="alert alert-error">{listError}</p>}
        {!isLoadingList && !listError && admins.length === 0 && (
          <div className="ma-empty">No admins invited yet.</div>
        )}

        {!isLoadingList && admins.length > 0 && (
          <div className="card ma-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.full_name || '—'}</td>
                    <td>{admin.email}</td>
                    <td>{admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[admin.invitation_status] || ''}`}>
                        {STATUS_LABELS[admin.invitation_status] || admin.invitation_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default ManageAdmins