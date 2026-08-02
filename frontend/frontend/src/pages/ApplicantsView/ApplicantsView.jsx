import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import api from '../../services/api.js'
import AppShell from '../../components/AppShell/AppShell.jsx'
import './ApplicantsView.css'

function ApplicantsView() {
  const { type, id } = useParams()
  const location = useLocation()
  const label = location.state?.label

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadApplicants() {
      setIsLoading(true)
      setError('')
      try {
        const response = await api.get(`/opportunities/${type}/${id}/applicants`)
        setData(response.data)
      } catch (err) {
        const detail = err.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Could not load applicants.')
      } finally {
        setIsLoading(false)
      }
    }
    loadApplicants()
  }, [type, id])

  return (
    <AppShell title={label || 'Applicants'}>
      <Link to="/admin/opportunities" className="av-back">← Back to Manage Opportunities</Link>

      {isLoading && <p className="muted">Loading applicants…</p>}
      {error && <p className="alert alert-error">{error}</p>}

      {data && (
        <>
          <div className="av-summary">
            <div className="av-stat av-stat-applied">
              <span className="av-count">{data.applied_count}</span>
              <span className="av-label">Applied</span>
            </div>
            <div className="av-stat av-stat-not">
              <span className="av-count">{data.not_applied_count}</span>
              <span className="av-label">Not Applied</span>
            </div>
          </div>

          <div className="av-columns">
            <div className="av-column">
              <h3 className="av-col-title">Applied</h3>
              {data.applied.length === 0 ? (
                <div className="av-empty">No one has applied yet.</div>
              ) : (
                <div className="card av-table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Name</th><th>Register Number</th></tr>
                    </thead>
                    <tbody>
                      {data.applied.map((s) => (
                        <tr key={s.id}>
                          <td>{s.full_name}</td>
                          <td>{s.register_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="av-column">
              <h3 className="av-col-title">Not Applied</h3>
              {data.not_applied.length === 0 ? (
                <div className="av-empty">Everyone has applied.</div>
              ) : (
                <div className="card av-table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Name</th><th>Register Number</th></tr>
                    </thead>
                    <tbody>
                      {data.not_applied.map((s) => (
                        <tr key={s.id}>
                          <td>{s.full_name}</td>
                          <td>{s.register_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}

export default ApplicantsView