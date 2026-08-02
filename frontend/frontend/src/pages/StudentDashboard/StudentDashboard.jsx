import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api.js'
import AppShell from '../../components/AppShell/AppShell.jsx'
import './StudentDashboard.css'

/** Returns { label, tone } for the deadline pill. tone: 'ok' | 'warn' | 'closed' */
function deadlineInfo(isoString) {
  const deadline = new Date(isoString)
  const now = new Date()
  const msRemaining = deadline - now
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
  const dateLabel = deadline.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

  if (msRemaining < 0) return { label: `Closed · ${dateLabel}`, tone: 'closed' }
  if (daysRemaining <= 1) return { label: `Closes today · ${dateLabel}`, tone: 'warn' }
  if (daysRemaining <= 3) return { label: `${daysRemaining} days left · ${dateLabel}`, tone: 'warn' }
  return { label: `${daysRemaining} days left · ${dateLabel}`, tone: 'ok' }
}

function isClosed(isoString) {
  return new Date(isoString) < new Date()
}

function OpportunityCard({ item, type, name, detail, link, applied, closed, applyingId, onApply }) {
  const dl = deadlineInfo(item.last_date_to_apply)
  return (
    <div className="opp-card">
      <div className="opp-card-top">
        <h3 className="opp-card-title">{name}</h3>
        {item.is_existing_company && <span className="badge badge-accent">Returning</span>}
      </div>

      {detail && <p className="opp-card-detail">{detail}</p>}

      <span className={`opp-deadline opp-deadline-${dl.tone}`}>
        <span className="opp-deadline-dot" />
        {dl.label}
      </span>

      <div className="opp-card-actions">
        <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary opp-link">
          Open Link ↗
        </a>
        <button
          className={`btn ${applied ? 'btn-ghost opp-applied' : 'btn-primary'}`}
          disabled={applied || closed || applyingId === item.id}
          onClick={() => onApply(type, item.id)}
        >
          {applied ? 'Applied ✓' : applyingId === item.id ? 'Applying…' : closed ? 'Closed' : 'Mark as Applied'}
        </button>
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="opp-card">
      <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 13, width: '90%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 13, width: '40%', marginBottom: 18 }} />
      <div className="skeleton" style={{ height: 36, width: '100%' }} />
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="opp-empty">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
           strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/>
      </svg>
      <p>{text}</p>
    </div>
  )
}

function StudentDashboard() {
  const [onCampusList, setOnCampusList] = useState([])
  const [offCampusList, setOffCampusList] = useState([])
  const [appliedOnCampusIds, setAppliedOnCampusIds] = useState([])
  const [appliedOffCampusIds, setAppliedOffCampusIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [applyingId, setApplyingId] = useState(null)
  const [applyError, setApplyError] = useState('')

  async function loadDashboard() {
    setIsLoading(true)
    setLoadError('')
    try {
      const [onCampusRes, offCampusRes, myAppsRes] = await Promise.all([
        api.get('/opportunities/on-campus'),
        api.get('/opportunities/off-campus'),
        api.get('/opportunities/my-applications'),
      ])
      setOnCampusList(onCampusRes.data)
      setOffCampusList(offCampusRes.data)
      setAppliedOnCampusIds(myAppsRes.data.on_campus_ids)
      setAppliedOffCampusIds(myAppsRes.data.off_campus_ids)
    } catch (err) {
      const detail = err.response?.data?.detail
      setLoadError(typeof detail === 'string' ? detail : 'Could not load opportunities.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function handleApply(type, id) {
    setApplyError('')
    setApplyingId(id)
    try {
      await api.post(`/opportunities/${type}/${id}/apply`)
      if (type === 'on-campus') {
        setAppliedOnCampusIds((prev) => [...prev, id])
      } else {
        setAppliedOffCampusIds((prev) => [...prev, id])
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      setApplyError(typeof detail === 'string' ? detail : 'Could not record your application.')
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <AppShell title="Dashboard">
      <div className="sd-intro">
        <div>
          <h2 className="sd-intro-title">Opportunities</h2>
          <p className="muted sd-intro-sub">Browse open drives and mark the ones you've applied to.</p>
        </div>
        <Link to="/company-search" className="btn btn-secondary">Search Companies</Link>
      </div>

      {applyError && <p className="alert alert-error">{applyError}</p>}
      {loadError && <p className="alert alert-error">{loadError}</p>}

      {/* On-campus */}
      <section className="opp-section">
        <div className="opp-section-head">
          <h3 className="opp-section-title">Companies Visiting Soon</h3>
          {!isLoading && <span className="opp-count">{onCampusList.length}</span>}
        </div>

        {isLoading ? (
          <div className="opp-grid">
            <CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : onCampusList.length === 0 ? (
          <EmptyState text="No on-campus drives posted yet." />
        ) : (
          <div className="opp-grid">
            {onCampusList.map((item) => (
              <OpportunityCard
                key={item.id}
                item={item}
                type="on-campus"
                name={item.company_name}
                detail={item.eligibility_criteria}
                link={item.registration_link}
                applied={appliedOnCampusIds.includes(item.id)}
                closed={isClosed(item.last_date_to_apply)}
                applyingId={applyingId}
                onApply={handleApply}
              />
            ))}
          </div>
        )}
      </section>

      {/* Off-campus */}
      <section className="opp-section">
        <div className="opp-section-head">
          <h3 className="opp-section-title">Off-Campus Opportunities</h3>
          {!isLoading && <span className="opp-count">{offCampusList.length}</span>}
        </div>

        {isLoading ? (
          <div className="opp-grid">
            <CardSkeleton /><CardSkeleton />
          </div>
        ) : offCampusList.length === 0 ? (
          <EmptyState text="No off-campus opportunities posted yet." />
        ) : (
          <div className="opp-grid">
            {offCampusList.map((item) => (
              <OpportunityCard
                key={item.id}
                item={item}
                type="off-campus"
                name={item.title}
                detail={item.description}
                link={item.link}
                applied={appliedOffCampusIds.includes(item.id)}
                closed={isClosed(item.last_date_to_apply)}
                applyingId={applyingId}
                onApply={handleApply}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}

export default StudentDashboard