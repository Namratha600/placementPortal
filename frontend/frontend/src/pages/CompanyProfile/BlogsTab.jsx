import { useState, useEffect } from "react";
import api from "../../services/api";
import "./BlogsTab.css";

/**
 * BlogsTab — interview-experience blogs for one company. (Redesign: styling only.)
 */
export default function BlogsTab({ companyId, companyName }) {
  const role = getRoleFromToken();
  const isStudent = role === "student";
  const isAdmin = role === "admin" || role === "super_admin";

  const [blogs, setBlogs] = useState([]);
  const [sort, setSort] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [expandedId, setExpandedId] = useState(null);
  const [expandedContent, setExpandedContent] = useState("");

  async function loadBlogs() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/blogs", { params: { company_id: companyId, sort } });
      setBlogs(res.data.items || []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not load blogs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBlogs(); /* eslint-disable-next-line */ }, [companyId, sort]);

  function openNewForm() {
    setEditingId(null); setTitle(""); setContent(""); setFormError(""); setShowForm(true);
  }

  function openEditForm(blog) {
    setEditingId(blog.id);
    setTitle(blog.title);
    api.get(`/blogs/${blog.id}`)
      .then((res) => setContent(res.data.content || ""))
      .catch(() => setContent(""));
    setFormError(""); setShowForm(true);
  }

  async function submitForm() {
    setSubmitting(true); setFormError("");
    try {
      if (editingId) {
        await api.put(`/blogs/${editingId}`, { title, content });
      } else {
        await api.post("/blogs", { title, content, company_id: Number(companyId) });
      }
      setShowForm(false); setTitle(""); setContent(""); setEditingId(null);
      await loadBlogs();
    } catch (err) {
      setFormError(err?.response?.data?.detail || "Could not save blog.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleUpvote(blog) {
    try {
      const res = await api.post(`/blogs/${blog.id}/upvote`);
      setBlogs((prev) => prev.map((b) =>
        b.id === blog.id
          ? { ...b, has_upvoted: res.data.upvoted, upvote_count: res.data.upvote_count }
          : b));
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not upvote.");
    }
  }

  async function removeBlog(blog) {
    if (!window.confirm("Delete this blog?")) return;
    try {
      await api.delete(`/blogs/${blog.id}`);
      setBlogs((prev) => prev.filter((b) => b.id !== blog.id));
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not delete blog.");
    }
  }

  async function toggleExpand(blog) {
    if (expandedId === blog.id) { setExpandedId(null); setExpandedContent(""); return; }
    try {
      const res = await api.get(`/blogs/${blog.id}`);
      setExpandedId(blog.id);
      setExpandedContent(res.data.content || "");
    } catch {
      setExpandedContent("Could not load content.");
      setExpandedId(blog.id);
    }
  }

  return (
    <div>
      <div className="bt-toolbar">
        <div className="bt-sort">
          <button className={`bt-sort-btn ${sort === "latest" ? "active" : ""}`}
                  onClick={() => setSort("latest")}>Latest</button>
          <button className={`bt-sort-btn ${sort === "upvotes" ? "active" : ""}`}
                  onClick={() => setSort("upvotes")}>Most Upvoted</button>
        </div>
        {isStudent && (
          <button className="btn btn-primary" onClick={openNewForm}>+ Write a blog</button>
        )}
      </div>

      {showForm && (
        <div className="bt-form">
          <h3 className="bt-form-title">{editingId ? "Edit blog" : `New blog about ${companyName}`}</h3>
          <input className="input" placeholder="Title" maxLength={150}
                 value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="textarea bt-textarea" placeholder="Share your interview experience, coding questions, tips…"
                    rows={6} maxLength={20000} value={content}
                    onChange={(e) => setContent(e.target.value)} />
          <div className={`bt-counter ${content.length > 19000 ? "warn" : ""}`}>
            {content.length} / 20,000
          </div>
          {formError && <p className="alert alert-error">{formError}</p>}
          <div className="bt-form-actions">
            <button className="btn btn-primary" disabled={submitting} onClick={submitForm}>
              {submitting ? "Saving…" : editingId ? "Update" : "Publish"}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <p className="muted">Loading blogs…</p>}
      {error && <p className="alert alert-error">{error}</p>}
      {!loading && blogs.length === 0 && (
        <div className="bt-empty">No blogs yet. Be the first to share your experience.</div>
      )}

      {blogs.map((b) => (
        <div key={b.id} className="bt-card">
          <div className="bt-card-head">
            <div>
              <div className="bt-card-title" onClick={() => toggleExpand(b)}>{b.title}</div>
              <div className="bt-card-meta">
                by {b.author_name || "Anonymous"} · {new Date(b.created_at).toLocaleDateString()}
                {b.is_author && <span className="bt-you">you</span>}
              </div>
            </div>
            <button className={`bt-upvote ${b.has_upvoted ? "active" : ""}`}
                    onClick={() => toggleUpvote(b)} disabled={!isStudent}
                    title={isStudent ? "Upvote" : "Only students can upvote"}>
              ▲ {b.upvote_count}
            </button>
          </div>

          {expandedId === b.id && <div className="bt-body">{expandedContent}</div>}

          <div className="bt-actions">
            <button className="bt-link" onClick={() => toggleExpand(b)}>
              {expandedId === b.id ? "Hide" : "Read"}
            </button>
            {b.is_author && <button className="bt-link" onClick={() => openEditForm(b)}>Edit</button>}
            {(b.is_author || isAdmin) && (
              <button className="bt-link danger" onClick={() => removeBlog(b)}>Delete</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function getRoleFromToken() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const val = localStorage.getItem(localStorage.key(i)) || "";
      const token = extractJwt(val);
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload && payload.role) return payload.role;
      }
    }
  } catch { /* ignore */ }
  return null;
}

function extractJwt(value) {
  if (/^[\w-]+\.[\w-]+\.[\w-]+$/.test(value)) return value;
  try {
    const obj = JSON.parse(value);
    for (const k of ["token", "access_token", "accessToken", "jwt"]) {
      if (obj && typeof obj[k] === "string" && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(obj[k])) return obj[k];
    }
  } catch { /* not json */ }
  return null;
}