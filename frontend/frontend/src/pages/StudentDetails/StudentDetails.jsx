import { useEffect, useState } from 'react'
import api from '../../services/api.js'
import AppShell from '../../components/AppShell/AppShell.jsx'
import './StudentDetails.css'

const CATEGORIES = ['OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'SC', 'ST']
const STAY_TYPES = ['Day Scholar', 'Hosteler']

const STEPS = ['Personal', 'Academic', 'Family', 'Address', 'Identity']

const EMPTY = {
  full_name: '', phone: '', date_of_birth: '', alt_email: '', category: '',
  course: '', batch: '', branch: '', section: '',
  father_name: '', father_occupation: '', mother_name: '', mother_maiden_name: '', parent_mobile_no: '',
  address_for_communication: '', hometown: '', district: '', state: '', pincode: '', stay_type: '',
  aadhar_no: '', name_as_per_aadhar: '', pan_number: '',
}

export default function StudentDetails() {
  const [form, setForm] = useState(EMPTY)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [readonly, setReadonly] = useState({ register_number: '', email: '' })

  useEffect(() => {
    api.get('/students/me/details')
      .then((res) => {
        const d = res.data || {}
        setReadonly({ register_number: d.register_number || '', email: d.email || '' })
        setForm({
          ...EMPTY,
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, d[k] ?? ''])),
        })
      })
      .catch((err) => setError(err?.response?.data?.detail || 'Could not load your details.'))
      .finally(() => setLoading(false))
  }, [])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function extractError(err, fallback) {
    const detail = err?.response?.data?.detail
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(' ')
    return detail || fallback
  }

  async function save() {
    setSaving(true); setError(''); setSuccess('')
    try {
      // Send only non-empty values; empty date/strings stay untouched.
      const payload = {}
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null) payload[k] = v
      })
      const res = await api.put('/students/me/details', payload)
      const d = res.data || {}
      setForm({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, d[k] ?? ''])) })
      setSuccess('Details saved.')
    } catch (err) {
      setError(extractError(err, 'Could not save your details.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AppShell title="Student Details"><div className="skeleton" style={{ height: 320, borderRadius: 12 }} /></AppShell>
  }

  return (
    <AppShell title="Student Details">
      <div className="sd-wizard card">
        <div className="sd-steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`sd-step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                 onClick={() => setStep(i)}>
              <span>{i + 1}</span>
              <label>{s}</label>
            </div>
          ))}
        </div>

        {error && <p className="alert alert-error">{error}</p>}
        {success && <p className="alert alert-success">{success}</p>}

        {/* Step 1 — Personal */}
        {step === 0 && (
          <div className="sd-grid">
            <Field label="Register Number"><input className="input" value={readonly.register_number} readOnly /></Field>
            <Field label="College Email"><input className="input" value={readonly.email} readOnly /></Field>
            <Field label="Full Name"><input className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} /></Field>
            <Field label="Date of Birth"><input className="input" type="date" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} /></Field>
            <Field label="Mobile Number"><input className="input" maxLength={10} value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} /></Field>
            <Field label="Alternative Email"><input className="input" type="email" value={form.alt_email} onChange={(e) => set('alt_email', e.target.value)} /></Field>
            <Field label="Category">
              <select className="select" value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">Select</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        )}

        {/* Step 2 — Academic */}
        {step === 1 && (
          <div className="sd-grid">
            <Field label="Course"><input className="input" value={form.course} onChange={(e) => set('course', e.target.value)} placeholder="e.g. B.Tech" /></Field>
            <Field label="Batch"><input className="input" value={form.batch} onChange={(e) => set('batch', e.target.value)} placeholder="e.g. 2024-2028" /></Field>
            <Field label="Branch"><input className="input" value={form.branch} onChange={(e) => set('branch', e.target.value)} placeholder="e.g. CSE" /></Field>
            <Field label="Section"><input className="input" value={form.section} onChange={(e) => set('section', e.target.value)} placeholder="e.g. A" /></Field>
          </div>
        )}

        {/* Step 3 — Family */}
        {step === 2 && (
          <div className="sd-grid">
            <Field label="Father's Name"><input className="input" value={form.father_name} onChange={(e) => set('father_name', e.target.value)} /></Field>
            <Field label="Father's Occupation"><input className="input" value={form.father_occupation} onChange={(e) => set('father_occupation', e.target.value)} /></Field>
            <Field label="Mother's Name"><input className="input" value={form.mother_name} onChange={(e) => set('mother_name', e.target.value)} /></Field>
            <Field label="Mother's Maiden Name"><input className="input" value={form.mother_maiden_name} onChange={(e) => set('mother_maiden_name', e.target.value)} /></Field>
            <Field label="Parent's Mobile"><input className="input" maxLength={10} value={form.parent_mobile_no} onChange={(e) => set('parent_mobile_no', e.target.value.replace(/\D/g, '').slice(0, 10))} /></Field>
          </div>
        )}

        {/* Step 4 — Address */}
        {step === 3 && (
          <div className="sd-grid">
            <Field label="Address for Communication" full><textarea className="textarea" rows={3} value={form.address_for_communication} onChange={(e) => set('address_for_communication', e.target.value)} /></Field>
            <Field label="Hometown"><input className="input" value={form.hometown} onChange={(e) => set('hometown', e.target.value)} /></Field>
            <Field label="District"><input className="input" value={form.district} onChange={(e) => set('district', e.target.value)} /></Field>
            <Field label="State"><input className="input" value={form.state} onChange={(e) => set('state', e.target.value)} /></Field>
            <Field label="Pincode"><input className="input" maxLength={6} value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} /></Field>
            <Field label="Stay Type">
              <select className="select" value={form.stay_type} onChange={(e) => set('stay_type', e.target.value)}>
                <option value="">Select</option>
                {STAY_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        )}

        {/* Step 5 — Identity */}
        {step === 4 && (
          <div className="sd-grid">
            <Field label="Aadhar Number"><input className="input" maxLength={12} value={form.aadhar_no} onChange={(e) => set('aadhar_no', e.target.value.replace(/\D/g, '').slice(0, 12))} /></Field>
            <Field label="Name as per Aadhar"><input className="input" value={form.name_as_per_aadhar} onChange={(e) => set('name_as_per_aadhar', e.target.value)} /></Field>
            <Field label="PAN Number (optional)"><input className="input" value={form.pan_number} onChange={(e) => set('pan_number', e.target.value.toUpperCase())} /></Field>
          </div>
        )}

        <div className="sd-actions">
          <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>← Back</button>
          <div className="sd-actions-right">
            <button className="btn btn-secondary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>
            {step < STEPS.length - 1 && (
              <button className="btn btn-primary" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Next →</button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Field({ label, children, full }) {
  return (
    <div className={`sd-field ${full ? 'sd-field-full' : ''}`}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}