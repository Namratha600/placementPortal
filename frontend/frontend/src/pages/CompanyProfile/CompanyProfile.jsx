import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import api from "../../services/api";
import AppShell from "../../components/AppShell/AppShell.jsx";
import BlogsTab from "./BlogsTab";
import "./CompanyProfile.css";

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
                    "#06b6d4", "#ec4899", "#84cc16"];
const AXIS = "#64707e";
const GRID = "#232b36";

const tooltipStyle = {
  background: "#171d27",
  border: "1px solid #2c3542",
  borderRadius: 8,
  color: "#e7ebf0",
  fontSize: 13,
};

export default function CompanyProfile() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("analytics");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/companies/${companyId}/analytics`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled)
          setError(err?.response?.data?.detail || "Could not load company analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [companyId]);

  const content = () => {
    if (loading) return <p className="muted">Loading…</p>;
    if (error) return <p className="alert alert-error">{error}</p>;
    if (!data) return null;

    const { company, total_hires, highest_package, average_package,
            year_wise, branch_wise, roles } = data;

    const yearData = (year_wise || []).map((y) => ({
      year: y.year == null ? "Unknown" : String(y.year), count: y.count,
    }));
    const branchData = (branch_wise || []).map((b) => ({
      name: b.branch || "Unknown", value: b.count,
    }));

    return (
      <>
        <button className="cp-back" onClick={() => navigate(-1)}>← Back</button>

        <div className="cp-header">
          <h2 className="cp-title">{company.name}</h2>
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer" className="cp-web">
              {company.website}
            </a>
          )}
        </div>

        <div className="cp-tabs">
          <button className={`cp-tab ${tab === "analytics" ? "active" : ""}`}
                  onClick={() => setTab("analytics")}>Analytics</button>
          <button className={`cp-tab ${tab === "blogs" ? "active" : ""}`}
                  onClick={() => setTab("blogs")}>Blogs</button>
        </div>

        {tab === "analytics" && (
          <div>
            {company.description && <p className="cp-desc">{company.description}</p>}

            <div className="cp-cards">
              <div className="cp-stat"><div className="cp-stat-val">{total_hires ?? 0}</div><div className="cp-stat-lbl">Total Hires</div></div>
              <div className="cp-stat"><div className="cp-stat-val">{highest_package != null ? `${highest_package} LPA` : "—"}</div><div className="cp-stat-lbl">Highest Package</div></div>
              <div className="cp-stat"><div className="cp-stat-val">{average_package != null ? `${average_package} LPA` : "—"}</div><div className="cp-stat-lbl">Average Package</div></div>
            </div>

            {total_hires === 0 ? (
              <div className="cp-empty">No placement records yet for this company.</div>
            ) : (
              <div className="cp-charts">
                <div className="card cp-chart">
                  <h3 className="cp-chart-title">Year-wise Hiring</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={yearData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                      <XAxis dataKey="year" stroke={AXIS} fontSize={12} />
                      <YAxis allowDecimals={false} stroke={AXIS} fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card cp-chart">
                  <h3 className="cp-chart-title">Branch-wise Selection</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={branchData} dataKey="value" nameKey="name"
                           cx="50%" cy="50%" outerRadius={90} label>
                        {branchData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#9aa7b6" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {roles && roles.length > 0 && (
              <div className="card cp-roles">
                <h3 className="cp-chart-title">Roles Hired</h3>
                <ul className="cp-roles-list">
                  {roles.map((r, i) => (
                    <li key={i} className="cp-role-item">
                      <span>{r.role || "Unspecified"}</span>
                      <span className="cp-role-count">{r.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === "blogs" && (
          <BlogsTab companyId={companyId} companyName={company.name} />
        )}
      </>
    );
  };

  return <AppShell title="Company">{content()}</AppShell>;
}