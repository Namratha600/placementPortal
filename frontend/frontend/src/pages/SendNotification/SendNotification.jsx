import { useState, useEffect } from "react";
import api from "../../services/api";

/**
 * SendNotification (admin / super_admin)
 * Compose an announcement and send it to all students, a branch, a batch
 * (graduation year), or a batch + branch.
 */
const BRANCHES = ["EEE", "MECH", "ECE", "CSE", "IT", "ML", "DS", "CYBER"];

export default function SendNotification() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("");
  const [years, setYears] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/students/graduation-years")
      .then((res) => {
        const ys = (res.data || []).map(String);
        setYears(ys);
        if (ys.length) setYear(ys[0]);
      })
      .catch(() => setYears([]));
  }, []);

  const needsBranch = targetType === "branch" || targetType === "year_branch";
  const needsYear = targetType === "year" || targetType === "year_branch";

  async function send() {
    setBusy(true); setResult(""); setError("");
    try {
      const payload = { title, message, target_type: targetType };
      if (needsBranch) payload.target_branch = branch;
      if (needsYear) payload.target_year = Number(year);
      const res = await api.post("/notifications/broadcast", payload);
      setResult(res.data.message || "Sent.");
      setTitle(""); setMessage("");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map((d) => d.msg).join(" ")
                                     : (detail || "Could not send."));
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || !title || !message ||
    (needsYear && !year);

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Send Notification</h1>
      <div style={styles.card}>
        {result && <p style={styles.success}>{result}</p>}
        {error && <p style={styles.error}>{error}</p>}

        <label style={styles.label}>Title</label>
        <input style={styles.input} value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="e.g. Campus drive schedule updated" />

        <label style={styles.label}>Message</label>
        <textarea style={styles.textarea} rows={5} value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write the announcement students will see…" />

        <label style={styles.label}>Send to</label>
        <div style={styles.row}>
          <select style={styles.select} value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}>
            <option value="all">All students</option>
            <option value="branch">A specific branch</option>
            <option value="year">A specific batch (year)</option>
            <option value="year_branch">A batch + branch</option>
          </select>

          {needsYear && (
            <select style={styles.select} value={year}
                    onChange={(e) => setYear(e.target.value)}>
              {years.length === 0 && <option value="">No batches</option>}
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}

          {needsBranch && (
            <select style={styles.select} value={branch}
                    onChange={(e) => setBranch(e.target.value)}>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
        </div>

        <button style={styles.primary} disabled={disabled} onClick={send}>
          {busy ? "Sending…" : "Send Notification"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 640, margin: "24px auto", padding: "0 16px" },
  h1: { fontSize: 24 },
  card: { background: "#fff", border: "1px solid #eef0f4", borderRadius: 12, padding: 20 },
  label: { display: "block", fontSize: 13, color: "#555", margin: "12px 0 6px" },
  input: { width: "100%", padding: "10px 12px", fontSize: 15, border: "1px solid #ccc",
           borderRadius: 8, boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px 12px", fontSize: 15, border: "1px solid #ccc",
              borderRadius: 8, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" },
  row: { display: "flex", gap: 10, flexWrap: "wrap" },
  select: { padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8,
            fontSize: 14, background: "#fff" },
  primary: { marginTop: 18, padding: "11px 20px", background: "#4f46e5", color: "#fff",
             border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15 },
  success: { color: "#10b981" },
  error: { color: "#ef4444" },
};