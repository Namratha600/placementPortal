import { useState } from "react";
import api from "../../services/api";
import AppShell from "../../components/AppShell/AppShell.jsx";
import "./StudentSearch.css";

/**
 * StudentSearch (admin / super_admin) — redesign: styling only.
 */
export default function StudentSearch() {
  const [reg, setReg] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resumeBusy, setResumeBusy] = useState(false);

  async function search() {
    const q = reg.trim();
    if (!q) return;
    setLoading(true); setError(""); setProfile(null);
    try {
      const res = await api.get(`/students/by-register/${encodeURIComponent(q)}/profile`);
      setProfile(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Student not found.");
    } finally {
      setLoading(false);
    }
  }

  async function openResume() {
    if (!profile) return;
    try {
      const res = await api.get(`/students/${profile.id}/resume/view`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      window.open(url, "_blank", "noopener");
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not open resume.");
    }
  }

  async function downloadResume() {
    if (!profile) return;
    setResumeBusy(true);
    try {
      const res = await api.get(`/students/${profile.id}/resume/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${profile.register_number}-RESUME.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not download resume.");
    } finally {
      setResumeBusy(false);
    }
  }

  return (
    <AppShell title="Student Search">
      <div className="ss-search">
        <input
          className="input ss-input"
          placeholder="Enter register number (e.g. 24B01A1286)"
          value={reg}
          onChange={(e) => setReg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button className="btn btn-primary" onClick={search} disabled={loading || !reg.trim()}>
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {profile && (
        <div className="card ss-card">
          <div className="ss-head">
            <div>
              <h2 className="ss-name">{profile.full_name}</h2>
              <div className="ss-reg">{profile.register_number}</div>
            </div>
            <div className="ss-resume-btns">
              {profile.has_resume ? (
                <>
                  <button className="btn btn-ghost" onClick={openResume}>Open Resume</button>
                  <button className="btn btn-primary" disabled={resumeBusy} onClick={downloadResume}>
                    {resumeBusy ? "…" : "Download Resume"}
                  </button>
                </>
              ) : (
                <span className="subtle">No resume uploaded</span>
              )}
            </div>
          </div>

          <div className="ss-grid">
            <Field label="Branch" value={profile.branch} />
            <Field label="Email" value={profile.email} />
            <Field label="Phone" value={profile.phone} />
            <Field label="CGPA" value={profile.cgpa != null ? profile.cgpa : "—"} />
          </div>

          <div className="ss-section">
            <div className="ss-section-label">Skills</div>
            <div>{profile.skills || <span className="subtle">—</span>}</div>
          </div>

          <div className="ss-section">
            <div className="ss-section-label">Applications ({profile.applications.length})</div>
            {profile.applications.length === 0 ? (
              <span className="subtle">No applications yet.</span>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Type</th><th>Opportunity</th></tr>
                </thead>
                <tbody>
                  {profile.applications.map((a, i) => (
                    <tr key={i}>
                      <td>{a.opportunity_type === "on_campus" ? "On-campus" : "Off-campus"}</td>
                      <td>{a.company_or_title || `#${a.opportunity_id}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="ss-field-label">{label}</div>
      <div className="ss-field-value">{value != null && value !== "" ? value : "—"}</div>
    </div>
  );
}