import { useState, useEffect } from "react";
import api from "../../services/api";
import AppShell from "../../components/AppShell/AppShell.jsx";
import "./ManageCompanies.css";

/**
 * ManageCompanies (admin / super_admin) — redesign: styling only.
 */
export default function ManageCompanies() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 20 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", website: "", logo_url: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/companies", { params: { page, page_size: 20 } });
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not load companies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", description: "", website: "", logo_url: "" });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      description: c.description || "",
      website: c.website || "",
      logo_url: c.logo_url || "",
    });
    setFormError("");
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    setFormError("");
    const payload = { name: form.name };
    ["description", "website", "logo_url"].forEach((k) => {
      if (form[k] !== "") payload[k] = form[k];
    });
    try {
      if (editingId) {
        await api.put(`/companies/${editingId}`, payload);
      } else {
        await api.post("/companies", payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err?.response?.data?.detail || "Could not save company.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete "${c.name}"?`)) return;
    try {
      await api.delete(`/companies/${c.id}`);
      await load();
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not delete company.");
    }
  }

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.page_size || 20)));

  return (
    <AppShell title="Manage Companies">
      <div className="mc-head">
        <p className="muted mc-sub">Add, edit, or remove companies in the registry.</p>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Company</button>
      </div>

      {showForm && (
        <div className="card mc-form">
          <h3 className="mc-form-title">{editingId ? "Edit Company" : "Add Company"}</h3>
          <input className="input mc-mb" placeholder="Company name *"
                 value={form.name}
                 onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="textarea mc-mb" placeholder="Description" rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="input mc-mb" placeholder="Website (optional)"
                 value={form.website}
                 onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <input className="input mc-mb" placeholder="Logo URL (optional)"
                 value={form.logo_url}
                 onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
          {formError && <p className="alert alert-error">{formError}</p>}
          <div className="mc-form-actions">
            <button className="btn btn-primary" disabled={saving} onClick={save}>
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="alert alert-error">{error}</p>}

      {!loading && (
        <div className="card mc-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.description || <span className="subtle">—</span>}</td>
                  <td>
                    <button className="mc-link" onClick={() => openEdit(c)}>Edit</button>
                    <button className="mc-link danger" onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr><td colSpan={4}><span className="subtle">No companies yet.</span></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mc-pager">
        <button className="btn btn-ghost" disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span className="muted mc-page-info">Page {data.page} of {totalPages}</span>
        <button className="btn btn-ghost" disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </AppShell>
  );
}