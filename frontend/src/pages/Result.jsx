import { useNavigate } from "react-router-dom";
import { useApp } from "../App.jsx";
import { FEATURE_LABELS } from "../i18n/strings";

export default function Result() {
  const { t, lang, flow } = useApp();
  const nav = useNavigate();
  const r = flow.result;
  const labels = FEATURE_LABELS[lang];

  if (!r) {
    return (
      <div className="empty">
        No result yet.
        <br />
        <button className="btn" onClick={() => nav("/")} style={{ marginTop: 16 }}>
          {t.backHome}
        </button>
      </div>
    );
  }

  const tierColor = `tier-${r.tier}`;
  const score100 = Math.round((1 - r.pd_score) * 100);

  return (
    <>
      <div className="card score-hero">
        <div className="label">{t.yourTier}</div>
        <div className="score">{score100}</div>
        <div style={{ marginTop: 8 }}>
          <span className={`tier-badge ${tierColor}`}>Tier {r.tier}</span>
        </div>
        {r.loan_amount > 0 && (
          <div style={{ marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
            {t.eligibleFor}:{" "}
            <strong style={{ color: "var(--primary-dark)" }}>
              ₹ {r.loan_amount.toLocaleString("en-IN")}
            </strong>
          </div>
        )}
      </div>

      <div className="card">
        <h2>{t.drivers}</h2>
        {r.top_drivers.map((d, i) => (
          <div key={i} className={"driver " + (d.direction === "decreases_risk" ? "pos" : "neg")}>
            <span>
              {d.direction === "decreases_risk" ? "✓" : "⚠"} {labels[d.feature] || d.label}
            </span>
            <span style={{ fontWeight: 600 }}>
              {d.feature_value < 1 ? (d.feature_value * 100).toFixed(0) + "%" : d.feature_value.toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      {r.counterfactuals && r.counterfactuals.length > 0 && (
        <div>
          <h2 style={{ color: "var(--accent)", fontSize: 16, marginBottom: 10 }}>
            💡 {t.improve}
          </h2>
          {r.counterfactuals.map((cf, i) => (
            <div key={i} className="cf-card">
              <div className="path-name">Path {i + 1}</div>
              {cf.actions?.map((a, j) => (
                <div key={j} className="cf-action">
                  <strong>{labels[a.feature] || a.label}</strong>:{" "}
                  {a.current.toFixed(2)} → {a.target.toFixed(2)}{" "}
                  <span style={{ color: a.delta > 0 ? "var(--good)" : "var(--warn)" }}>
                    ({a.delta > 0 ? "+" : ""}{a.delta.toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>{t.psyBreakdown}</h2>
        {Object.entries(r.psychometric_breakdown).map(([k, v]) => (
          <div key={k}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span>{labels[k] || k}</span>
              <span>{(v * 100).toFixed(0)}%</span>
            </div>
            <div className="bar">
              <div style={{ width: `${v * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <button className="btn secondary" onClick={() => nav("/")}>
        {t.backHome}
      </button>
    </>
  );
}
