import { useState } from "react";
import api from "../../services/api";

/**
 * CgpaUpload (admin / super_admin)
 * Upload a CSV/Excel of Register Number + CGPA to update many students at once.
 */
export default function CgpaUpload() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function upload() {
    if (!file) { setError("Choose a .csv or .xlsx file first."); return; }
    setBusy(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/students/cgpa/upload", fd, {
        headers: { "Content-Type": undefined },
      });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Upload CGPA</h1>
      <div style={styles.card}>
        <p style={styles.muted}>
          Upload a .csv or .xlsx with two columns: <strong>Register Number</strong> and{" "}
          <strong>CGPA</strong>. Each row updates that student's CGPA (0–10). Rows
          whose register number doesn't match a student are skipped and listed below.
        </p>

        <div style={styles.uploadRow}>
          <input type="file" accept=".csv,.xlsx"
                 onChange={(e) => setFile(e.target.files[0] || null)} />
          <button style={styles.primary} disabled={busy} onClick={upload}>
            {busy ? "Uploading…" : "Upload"}
          </button>
        </div>
        {error && <p style={styles.error}>{error}</p>}

        {result && (
          <div style={styles.resultBox}>
            <div style={styles.resultRow}>
              <Stat label="Updated" value={result.updated} color="#10b981" />
              <Stat label="Skipped" value={result.skipped} color="#f59e0b" />
              <Stat label="Total rows" value={result.total_rows} color="#666" />
            </div>
            {result.errors?.length > 0 && (
              <div style={styles.errorsBox}>
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
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#777" }}>{label}</div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 640, margin: "24px auto", padding: "0 16px" },
  h1: { fontSize: 24 },
  card: { background: "#fff", border: "1px solid #eef0f4", borderRadius: 12, padding: 22 },
  muted: { color: "#666", fontSize: 14, lineHeight: 1.6 },
  uploadRow: { display: "flex", gap: 12, alignItems: "center", marginTop: 12 },
  primary: { padding: "9px 18px", background: "#4f46e5", color: "#fff",
             border: "none", borderRadius: 8, cursor: "pointer" },
  resultBox: { marginTop: 16, padding: 16, background: "#f8f9fb", borderRadius: 10 },
  resultRow: { display: "flex", gap: 28 },
  errorsBox: { marginTop: 10, color: "#b45309", fontSize: 14 },
  error: { color: "#ef4444" },
};