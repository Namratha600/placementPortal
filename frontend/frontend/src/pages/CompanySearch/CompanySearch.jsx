import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AppShell from "../../components/AppShell/AppShell.jsx";
import "./CompanySearch.css";

/**
 * CompanySearch — type-ahead company search. (Redesign: styling only.)
 */
export default function CompanySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/companies/search", { params: { q } });
        setResults(res.data || []);
        setOpen(true);
      } catch (err) {
        console.error("Company search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goToCompany(id) {
    setOpen(false);
    navigate(`/company/${id}`);
  }

  return (
    <AppShell title="Companies">
      <div className="cs-wrap">
        <h2 className="cs-heading">Search Companies</h2>
        <p className="muted cs-sub">
          Find a company to see its hiring analytics and interview experiences.
        </p>

        <div ref={boxRef} className="cs-search">
          <svg className="cs-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none"
               stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
          </svg>
          <input
            className="cs-input"
            type="text"
            placeholder="Start typing a company name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
          />

          {open && (
            <div className="cs-dropdown">
              {loading && <div className="cs-drop-muted">Searching…</div>}
              {!loading && results.length === 0 && (
                <div className="cs-drop-muted">No companies found</div>
              )}
              {!loading && results.map((c) => (
                <div
                  key={c.id}
                  className="cs-drop-item"
                  onClick={() => goToCompany(c.id)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}