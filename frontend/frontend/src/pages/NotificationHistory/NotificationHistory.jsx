import { useEffect, useState } from "react";
import api from "../../services/api";

/**
 * NotificationHistory (admin / super_admin)
 * Lists past broadcasts; click one to see full details + analytics
 * (Target Audience, Delivered, Read, Unread).
 */
export default function NotificationHistory() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api.get("/notifications/broadcasts")
      .then((res) => setList(res.data || []))
      .catch((err) => setError(err?.response?.data?.detail || "Could not load history."))
      .finally(() => setLoading(false));
  }, []);

  async function open(id) {
    setSelected(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.get(`/notifications/broadcasts/${id}`);
      setDetail(res.data);
    } catch (err) {
      setDetail(null);
      setError(err?.response?.data?.detail || "Could not load details.");
    } finally {
      setDetailLoading(false);
    }
  }

  function audienceLabel(b) {
    if (b.target_type === "all") return "All students";
    if (b.target_type === "branch") return `${b.target_branch} (all batches)`;
    if (b.target_type === "year") return `Batch ${b.target_year}`;
    if (b.target_type === "year_branch") return `${b.target_year} · ${b.target_branch}`;
    return b.target_type;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Notification History</h1>
      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.layout}>
        {/* List */}
        <div style={styles.listCol}>
          {loading ? (
            <p style={styles.muted}>Loading…</p>
          ) : list.length === 0 ? (
            <p style={styles.muted}>No notifications sent yet.</p>
          ) : (
            list.map((b) => (
              <div
                key={b.id}
                style={{ ...styles.listItem, ...(selected === b.id ? styles.listItemActive : {}) }}
                onClick={() => open(b.id)}
              >
                <div style={styles.listTitle}>{b.title}</div>
                <div style={styles.listMeta}>
                  {audienceLabel(b)} · {b.recipient_count} recipients
                </div>
                <div style={styles.listDate}>{new Date(b.created_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        <div style={styles.detailCol}>
          {!selected ? (
            <p style={styles.muted}>Select a notification to see its details and analytics.</p>
          ) : detailLoading ? (
            <p style={styles.muted}>Loading…</p>
          ) : detail ? (
            <div>
              <h2 style={styles.detailTitle}>{detail.title}</h2>
              <p style={styles.detailMsg}>{detail.message}</p>

              <div style={styles.audience}>
                <span style={styles.audienceLabel}>Target Audience</span>
                <span style={styles.audienceValue}>{detail.audience}</span>
              </div>

              <div style={styles.stats}>
                <Stat label="Delivered" value={detail.delivered} color="#4f46e5" />
                <Stat label="Read" value={detail.read} color="#10b981" />
                <Stat label="Unread" value={detail.unread} color="#f59e0b" />
              </div>

              <div style={styles.sentAt}>Sent {new Date(detail.created_at).toLocaleString()}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={styles.stat}>
      <div style={{ ...styles.statVal, color }}>{value}</div>
      <div style={styles.statLbl}>{label}</div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin: "24px auto", padding: "0 16px" },
  h1: { fontSize: 24 },
  layout: { display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" },
  listCol: { flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 8 },
  detailCol: { flex: "1 1 340px", background: "#fff", border: "1px solid #eef0f4",
               borderRadius: 12, padding: 20, minHeight: 200 },
  listItem: { background: "#fff", border: "1px solid #eef0f4", borderRadius: 10,
              padding: 14, cursor: "pointer" },
  listItemActive: { borderColor: "#4f46e5", boxShadow: "0 0 0 2px rgba(79,70,229,0.15)" },
  listTitle: { fontSize: 15, fontWeight: 600 },
  listMeta: { fontSize: 13, color: "#666", marginTop: 3 },
  listDate: { fontSize: 12, color: "#999", marginTop: 4 },
  detailTitle: { fontSize: 20, margin: "0 0 8px" },
  detailMsg: { color: "#444", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 18 },
  audience: { display: "flex", flexDirection: "column", gap: 2, marginBottom: 18 },
  audienceLabel: { fontSize: 12, color: "#888" },
  audienceValue: { fontSize: 15, fontWeight: 600, color: "#4f46e5" },
  stats: { display: "flex", gap: 24, marginBottom: 16 },
  stat: { textAlign: "center" },
  statVal: { fontSize: 28, fontWeight: 700 },
  statLbl: { fontSize: 12, color: "#777" },
  sentAt: { fontSize: 12, color: "#999", borderTop: "1px solid #f0f0f0", paddingTop: 12 },
  muted: { color: "#999" },
  error: { color: "#ef4444" },
};