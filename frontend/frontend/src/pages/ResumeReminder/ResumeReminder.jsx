import { useState } from "react";
import api from "../../services/api";

/**
 * ResumeReminder (admin / super_admin)
 * Manually trigger the resume-update reminder email to all students.
 * The automatic every-3-days run is handled by Windows Task Scheduler.
 */
export default function ResumeReminder() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function sendNow() {
    if (!window.confirm("Send a resume-update reminder email to ALL students now?")) return;
    setBusy(true); setResult(""); setError("");
    try {
      const res = await api.post("/admin/resume-reminders/send-now");
      setResult(res.data.message || "Sent.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not send reminders.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Resume Update Reminders</h1>
      <div style={styles.card}>
        <p style={styles.muted}>
          This emails every student a reminder to keep their resume up to date.
          Students are BCC'd on a single email. The reminder is also sent
          automatically every 3 days (via a scheduled task on the server).
        </p>

        {result && <p style={styles.success}>{result}</p>}
        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.primary} disabled={busy} onClick={sendNow}>
          {busy ? "Sending…" : "Send Reminder to All Students Now"}
        </button>

        <p style={styles.note}>
          Note: emails only send when the server has email enabled
          (EMAIL_ENABLED=true with valid SMTP settings).
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 620, margin: "24px auto", padding: "0 16px" },
  h1: { fontSize: 24 },
  card: { background: "#fff", border: "1px solid #eef0f4", borderRadius: 12, padding: 22 },
  muted: { color: "#666", fontSize: 14, lineHeight: 1.6 },
  primary: { marginTop: 8, padding: "11px 20px", background: "#4f46e5", color: "#fff",
             border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15 },
  note: { marginTop: 14, fontSize: 12, color: "#999" },
  success: { color: "#10b981" },
  error: { color: "#ef4444" },
};