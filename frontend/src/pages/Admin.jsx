import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../App.jsx";
import { listApplications, getApplication, getMetrics } from "../api/client";
import { FEATURE_LABELS } from "../i18n/strings";

export default function Admin() {
  const { id } = useParams();
  const { t, lang } = useApp();
  const nav = useNavigate();
  const [tab, setTab] = useState("apps");
  const [apps, setApps] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    listApplications().then(setApps).catch(() => setApps([]));
    getMetrics().then(setMetrics).catch(() => setMetrics(null));
  }, []);

  useEffect(() => {
    if (id) {
      getApplication(id).then(setDetail).catch(() => setDetail(null));
    } else {
      setDetail(null);
    }
  }, [id]);

  const labels = FEATURE_LABELS[lang];

  if (detail) {
    return (
      <>
        <button className="btn secondary" onClick={() => nav("/admin")} style={{ marginBottom: 12 }}>
          ← {t.adminApps}
        </button>
        <div className="card score-hero">
          <div className="label">PD score</div>
          <div className="score" style={{ fontSize: 38 }}>
            {(detail.pd_score * 100).toFixed(1)}%
          </div>
          <div style={{ marginTop: 8 }}>
            <span className={`tier-badge tier-${detail.tier}`}>Tier {detail.tier}</span>
          </div>
        </div>
        <div className="card">
          <h2>Applicant</h2>
          <div className="feature-row"><span>Name</span><span className="v">{detail.name}</span></div>
          <div className="feature-row"><span>Age</span><span className="v">{detail.age}</span></div>
          <div className="feature-row"><span>Dependents</span><span className="v">{detail.dependents}</span></div>
          <div className="feature-row"><span>Language</span><span className="v">{detail.language}</span></div>
          <div className="feature-row"><span>Model</span><span className="v">{detail.model_version}</span></div>
        </div>

        <div className="card">
          <h2>SHAP — top drivers</h2>
          {detail.top_drivers.map((d, i) => {
            const mag = Math.min(1, Math.abs(d.shap_value) / 0.5);
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>{labels[d.feature] || d.label}</span>
                  <span style={{ color: d.shap_value > 0 ? "var(--warn)" : "var(--good)" }}>
                    {d.shap_value > 0 ? "+" : ""}{d.shap_value.toFixed(3)}
                  </span>
                </div>
                <div className="bar">
                  <div style={{
                    width: `${mag * 100}%`,
                    background: d.shap_value > 0 ? "var(--warn)" : "var(--good)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h2>UPI features</h2>
          {Object.entries(detail.upi_features).map(([k, v]) => (
            <div key={k} className="feature-row">
              <span>{labels[k] || k}</span>
              <span className="v">{typeof v === "number" ? v.toFixed(2) : String(v)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Psychometric</h2>
          {Object.entries(detail.psychometric).filter(([k]) => !k.startsWith("_")).map(([k, v]) => (
            <div key={k} className="feature-row">
              <span>{labels[k] || k}</span>
              <span className="v">{Number(v).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="tabs">
        <button className={tab === "apps" ? "active" : ""} onClick={() => setTab("apps")}>
          {t.adminApps}
        </button>
        <button className={tab === "metrics" ? "active" : ""} onClick={() => setTab("metrics")}>
          {t.adminMetrics}
        </button>
      </div>

      {tab === "apps" && (
        <>
          {apps.length === 0 && <div className="empty">No applications yet.</div>}
          {apps.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{ cursor: "pointer" }}
              onClick={() => nav(`/admin/${a.id}`)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.name || `#${a.id}`}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {new Date(a.created_at).toLocaleString()} · {a.language}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className={`tier-badge tier-${a.tier}`}>Tier {a.tier}</span>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    PD {(a.pd_score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "metrics" && metrics && (
        <>
          <div className="card score-hero">
            <div className="label">Test AUC</div>
            <div className="score">{metrics.auc.toFixed(3)}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              Trained on {metrics.n_train.toLocaleString()} synthetic applicants
              · default rate {(metrics.default_rate_train * 100).toFixed(1)}%
            </div>
          </div>
          <div className="card">
            <h2>Feature importance (gain)</h2>
            {Object.entries(metrics.feature_importance)
              .sort((a, b) => b[1] - a[1])
              .map(([f, v]) => {
                const max = Math.max(...Object.values(metrics.feature_importance));
                return (
                  <div key={f} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span>{labels[f] || f}</span>
                      <span>{v.toFixed(0)}</span>
                    </div>
                    <div className="bar"><div style={{ width: `${(v / max) * 100}%` }} /></div>
                  </div>
                );
              })}
          </div>
        </>
      )}
      {tab === "metrics" && !metrics && (
        <div className="empty">Run train_model.py first to see model metrics.</div>
      )}
    </>
  );
}
