import { useState, useEffect } from "react";
import api from "../../services/api";
import AppShell from "../../components/AppShell/AppShell.jsx";
import "./PlacementRecords.css";

/**
 * PlacementRecords (admin / super_admin) — redesign: styling only.
 *   1. Upload — CSV/Excel -> POST /placement-records/upload
 *   2. Get Records — filter by Year / Branch / Company, paginated, Excel export.
 */
const BRANCHES = ["EEE", "MECH", "ECE", "CSE", "IT", "ML", "DS", "CYBER"];

export default function PlacementRecords() {
  const [companies, setCompanies] = useState([]);
  const companyMap = {};
  companies.forEach((c) => { companyMap[c.id] = c.name; });

  // Year filter options come from the DB (graduation years actually present),
  // plus any years already on records — no hardcoded range.
  const [years, setYears] = useState([]);

  // ---- upload state ----
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadError, setUploadError] = useState("");

  // ---- get records state ---- ("" = All)
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [records, setRecords] = useState({ items: [], total: 0, page: 1, page_size: 25 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await api.get("/companies", { params: { page: 1, page_size: 500 } });
        const items = (res.data.items || []).slice().sort((a, b) => a.name.localeCompare(b.name));
        setCompanies(items);
      } catch (err) {
        console.error("Could not load companies:", err);
      }
    }
    loadCompanies();

    api.get("/students/graduation-years")
      .then((res) => setYears((res.data || []).map(String)))
      .catch(() => setYears([]));
  }, []);

  function buildParams(extra = {}) {
    const params = { ...extra };
    if (year) params.year = Number(year);
    if (branch) params.branch = branch;
    if (companyId) params.company_id = Number(companyId);
    return params;
  }

  async function upload() {
    if (!file) { setUploadError("Choose a .csv or .xlsx file first."); return; }
    setUploading(true);
    setUploadError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/placement-records/upload", fd, {
        headers: { "Content-Type": undefined },
      });
      setResult(res.data);
    } catch (err) {
      setUploadError(err?.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function fetchRecords(goToPage = 1) {
    setLoading(true);
    setFetchError("");
    try {
      const res = await api.get("/placement-records", {
        params: buildParams({ page: goToPage, page_size: 25 }),
      });
      setRecords(res.data);
      setPage(goToPage);
    } catch (err) {
      setFetchError(err?.response?.data?.detail || "Could not fetch records.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadExcel() {
    setDownloading(true);
    try {
      const res = await api.get("/placement-records/export", {
        params: buildParams(),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "placement_records.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.response?.data?.detail || "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil((records.total || 0) / (records.page_size || 25)));

  return (
    <AppShell title="Placement Records">
      {/* ---------- Upload ---------- */}
      <section className="card pr-card">
        <h3 className="pr-card-title">Upload Records</h3>
        <p className="muted pr-note">
          Upload a .csv or .xlsx with columns: Roll Number, Student Name, Branch,
          Graduation Year, Company, Role, Package, Placement Date.
        </p>
        <div className="pr-upload-row">
          <input type="file" accept=".csv,.xlsx" className="pr-file"
                 onChange={(e) => setFile(e.target.files[0] || null)} />
          <button className="btn btn-primary" disabled={uploading} onClick={upload}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
        {uploadError && <p className="alert alert-error">{uploadError}</p>}
        {result && (
          <div className="pr-result">
            <div className="pr-stats">
              <Stat label="Inserted" value={result.inserted} color="#6ee7a0" />
              <Stat label="Updated" value={result.updated} color="#93b8fb" />
              <Stat label="Skipped" value={result.skipped} color="#fcd34d" />
              <Stat label="Total rows" value={result.total_rows} color="var(--text-muted)" />
            </div>
            {result.companies_created?.length > 0 && (
              <p className="muted">New companies created: {result.companies_created.join(", ")}</p>
            )}
            {result.errors?.length > 0 && (
              <div className="pr-errors">
                <strong>Skipped rows:</strong>
                <ul>
                  {result.errors.map((e, i) => (
                    <li key={i}>Row {e.row}: {e.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ---------- Get Records ---------- */}
      <section className="card pr-card">
        <h3 className="pr-card-title">Get Records</h3>
        <div className="pr-filters">
          <select className="select pr-sel" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="select pr-sel" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All Branches</option>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="select pr-sel-wide" value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">All Companies</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => fetchRecords(1)}>Get</button>
          <button className="btn btn-secondary" disabled={downloading} onClick={downloadExcel}>
            {downloading ? "Preparing…" : "⬇ Download Excel"}
          </button>
        </div>

        {fetchError && <p className="alert alert-error">{fetchError}</p>}
        {loading && <p className="muted">Loading…</p>}

        {!loading && (
          <>
            <div className="pr-table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No</th><th>Name</th><th>Branch</th><th>Year</th>
                    <th>Company</th><th>Role</th><th>Package</th>
                  </tr>
                </thead>
                <tbody>
                  {records.items.map((r) => (
                    <tr key={r.id}>
                      <td>{r.roll_number}</td>
                      <td>{r.student_name || "—"}</td>
                      <td>{r.branch || "—"}</td>
                      <td>{r.graduation_year || "—"}</td>
                      <td>{companyMap[r.company_id] || r.company_id}</td>
                      <td>{r.role || "—"}</td>
                      <td>{r.package != null ? r.package : "—"}</td>
                    </tr>
                  ))}
                  {records.items.length === 0 && (
                    <tr><td colSpan={7}>
                      <span className="subtle">No records. Set filters (or leave as All) and click Get.</span>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {records.total > 0 && (
              <div className="pr-pager">
                <button className="btn btn-ghost" disabled={page <= 1}
                        onClick={() => fetchRecords(page - 1)}>Prev</button>
                <span className="muted pr-page-info">
                  Page {records.page} of {totalPages} · {records.total} total
                </span>
                <button className="btn btn-ghost" disabled={page >= totalPages}
                        onClick={() => fetchRecords(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="pr-stat">
      <div className="pr-stat-val" style={{ color }}>{value}</div>
      <div className="pr-stat-lbl">{label}</div>
    </div>
  );
}