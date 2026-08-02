import { useEffect, useState } from 'react'
import api from '../../services/api.js'
import AppShell from '../../components/AppShell/AppShell.jsx'
import './StudentProfile.css'

const MAX_RESUME_MB = 2

function StudentProfile() {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [branch, setBranch] = useState('')
  const [cgpa, setCgpa] = useState('')
  const [skills, setSkills] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [placement, setPlacement] = useState(null)

  async function loadProfile() {
    setIsLoading(true)
    setLoadError('')
    try {
      const response = await api.get('/students/me/profile')
      setProfile(response.data)
      setBranch(response.data.branch || '')
      setCgpa(response.data.cgpa ?? '')
      setSkills(response.data.skills || '')
    } catch (err) {
      const detail = err.response?.data?.detail
      setLoadError(typeof detail === 'string' ? detail : 'Could not load your profile.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [])
  useEffect(() => {
    api.get('/students/me/placement-status')
      .then((res) => setPlacement(res.data))
      .catch(() => setPlacement(null))
  }, [])

  function extractErrorMessage(err, fallback) {
    const detail = err.response?.data?.detail
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(' ')
    return detail || fallback
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaveError('')
    setSaveSuccess('')

    setIsSaving(true)
    try {
      // CGPA intentionally not sent — managed by the placement cell.
      const response = await api.put('/students/me/profile', {
        branch: branch || null,
        skills: skills || null,
      })
      setProfile(response.data)
      setCgpa(response.data.cgpa ?? '')
      setSaveSuccess('Profile updated.')
    } catch (err) {
      setSaveError(extractErrorMessage(err, 'Could not save your profile.'))
    } finally {
      setIsSaving(false)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    setUploadError('')
    if (!file) { setSelectedFile(null); return }
    if (file.type !== 'application/pdf') {
      setUploadError('Resume must be a PDF file.')
      setSelectedFile(null)
      return
    }
    if (file.size > MAX_RESUME_MB * 1024 * 1024) {
      setUploadError(`Resume must be smaller than ${MAX_RESUME_MB}MB.`)
      setSelectedFile(null)
      return
    }
    setSelectedFile(file)
  }

  async function handleUploadResume(e) {
    e.preventDefault()
    setUploadError('')
    if (!selectedFile) { setUploadError('Choose a PDF file first.'); return }
    if (selectedFile.size > MAX_RESUME_MB * 1024 * 1024) {
      setUploadError(`Resume must be smaller than ${MAX_RESUME_MB}MB.`); return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    setIsUploading(true)
    try {
      const response = await api.post('/students/me/resume', formData, {
        headers: { 'Content-Type': undefined },
      })
      setProfile(response.data)
      setSelectedFile(null)
    } catch (err) {
      setUploadError(extractErrorMessage(err, 'Could not upload your resume.'))
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDownloadResume() {
    try {
      const response = await api.get('/students/me/resume', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', profile?.resume_filename || 'resume.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setUploadError('Could not download resume.')
    }
  }

  return (
    <AppShell title="My Profile">
      {isLoading && (
        <div className="pf-grid">
          <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
        </div>
      )}
      {loadError && <p className="alert alert-error">{loadError}</p>}

      {profile && (
        <div className="pf-grid">
          {/* Basic info */}
          <section className="card pf-card">
            <h3 className="pf-card-title">Basic Info</h3>
            <div className="pf-row"><span>Name</span><b>{profile.full_name}</b></div>
            <div className="pf-row"><span>Register Number</span><b>{profile.register_number}</b></div>
            <div className="pf-row"><span>Email</span><b>{profile.email}</b></div>
            <div className="pf-row"><span>Phone</span><b>{profile.phone}</b></div>
            <div className="pf-row pf-row-last">
              <span>CGPA</span>
              {cgpa !== '' && cgpa != null
                ? <b>{cgpa}</b>
                : <span className="subtle">Set by placement cell</span>}
            </div>
          </section>

          {/* Editable details */}
          <section className="card pf-card">
            <h3 className="pf-card-title">Editable Details</h3>
            <form onSubmit={handleSaveProfile} noValidate className="stack">
              {saveError && <p className="alert alert-error">{saveError}</p>}
              {saveSuccess && <p className="alert alert-success">{saveSuccess}</p>}

              <div>
                <label className="field-label">Branch</label>
                <input className="input" type="text" value={branch}
                       onChange={(e) => setBranch(e.target.value)} placeholder="e.g. CSE" />
              </div>

              <div>
                <label className="field-label">Skills</label>
                <textarea className="textarea" value={skills} rows={3}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="e.g. Python, React, SQL" />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </section>

          {/* Resume */}
          <section className="card pf-card">
            <h3 className="pf-card-title">Resume</h3>
            {uploadError && <p className="alert alert-error">{uploadError}</p>}

            {profile.resume_filename ? (
              <p className="pf-resume-status">
                Current: <strong>{profile.resume_filename}</strong>{' '}
                <button className="pf-link" onClick={handleDownloadResume}>Download</button>
              </p>
            ) : (
              <p className="muted" style={{ marginTop: 0 }}>No resume uploaded yet.</p>
            )}

            <form onSubmit={handleUploadResume} noValidate className="pf-resume-form">
              <input className="pf-file" type="file" accept="application/pdf" onChange={handleFileChange} />
              <button type="submit" className="btn btn-primary btn-block" disabled={isUploading}>
                {isUploading ? 'Uploading…' : 'Upload Resume'}
              </button>
              <p className="subtle" style={{ fontSize: 12, margin: 0 }}>PDF only, max {MAX_RESUME_MB}MB.</p>
            </form>
          </section>
          {/* Placement status */}
          <section className="card pf-card">
            <h3 className="pf-card-title">Placement Status</h3>
            {!placement ? (
              <p className="muted" style={{ marginTop: 0 }}>Loading…</p>
            ) : placement.is_placed ? (
              <>
                <div className="pf-row">
                  <span>Status</span>
                  <b style={{ color: '#22c55e' }}>Placed ✓</b>
                </div>
                <div className="pf-row">
                  <span>Total Offers</span><b>{placement.total_offers}</b>
                </div>
                <div className="pf-row pf-row-last">
                  <span>Highest Package</span>
                  <b>{placement.highest_package != null ? `${placement.highest_package} LPA` : '—'}</b>
                </div>
                <div style={{ marginTop: 12 }}>
                  {placement.placements.map((p, i) => (
                    <div key={i} className="pf-row">
                      <span>{p.company}{p.role ? ` · ${p.role}` : ''}</span>
                      <b>{p.package != null ? `${p.package} LPA` : '—'}</b>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="muted" style={{ marginTop: 0 }}>Not placed yet.</p>
            )}
          </section>
        </div>
      )}
    </AppShell>
  )
}

export default StudentProfile