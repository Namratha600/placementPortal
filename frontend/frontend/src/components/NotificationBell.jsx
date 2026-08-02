import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import "./NotificationBell.css";

/**
 * NotificationBell — topbar bell with unread badge + dropdown.
 * (Redesign: styling only. All polling/read logic unchanged.)
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  async function loadCount() {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnread(res.data.unread_count || 0);
    } catch { /* ignore */ }
  }

  async function loadList() {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setItems(res.data.items || []);
      setUnread(res.data.unread_count || 0);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  }

  async function onItemClick(n) {
    if (!n.is_read) {
      try {
        await api.post(`/notifications/${n.id}/read`);
        setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
        setUnread((u) => Math.max(u - 1, 0));
      } catch { /* ignore */ }
    }
    if (n.link) window.open(n.link, "_blank", "noopener");
  }

  async function markAll() {
    try {
      await api.post("/notifications/read-all");
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  }

  return (
    <div ref={ref} className="nb-wrap">
      <button className="nb-btn" onClick={toggle} aria-label="Notifications">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && <span className="nb-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="nb-panel">
          <div className="nb-head">
            <strong>Notifications</strong>
            {items.some((i) => !i.is_read) && (
              <button className="nb-markall" onClick={markAll}>Mark all read</button>
            )}
          </div>

          {loading && <div className="nb-muted">Loading…</div>}
          {!loading && items.length === 0 && <div className="nb-muted">You're all caught up.</div>}

          <div className="nb-list">
            {items.map((n) => (
              <div key={n.id}
                   className={`nb-item ${n.is_read ? "" : "unread"}`}
                   onClick={() => onItemClick(n)}>
                <div className="nb-item-top">
                  <span className="nb-item-title">{n.title}</span>
                  {n.type === "deadline" && <span className="badge badge-warning">Deadline</span>}
                </div>
                <div className="nb-item-msg">{n.message}</div>
                <div className="nb-item-time">
                  {new Date(n.created_at).toLocaleString()}
                  {n.link && <span className="nb-open"> · open ↗</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}