import { Link } from "react-router-dom";
import { useApp } from "../App.jsx";

export default function Home() {
  const { t } = useApp();
  return (
    <>
      <div className="card" style={{ textAlign: "center", padding: 28 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🪔</div>
        <h2 style={{ fontSize: 22, color: "var(--primary-dark)" }}>{t.welcome}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.5 }}>{t.welcomeSub}</p>
      </div>

      <div className="card">
        <h2>{t.appTitle === "सखी" ? "हम क्या देखते हैं" : "What we look at"}</h2>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
          {t.appTitle === "सखी" ? (
            <>
              ✓ आपकी UPI लेन-देन गतिविधि<br />
              ✓ आपकी आदतें और व्यवहार (10 प्रश्न)<br />
              ✓ कोई दस्तावेज़ या CIBIL नहीं<br />
              ✓ हर निर्णय की पारदर्शी व्याख्या
            </>
          ) : (
            <>
              ✓ Your real UPI transaction patterns<br />
              ✓ A short behavioral questionnaire<br />
              ✓ No documents, no CIBIL needed<br />
              ✓ A clear explanation of every decision
            </>
          )}
        </div>
      </div>

      <Link to="/applicant" className="btn" style={{ textDecoration: "none" }}>
        {t.startJourney} →
      </Link>

      <Link
        to="/admin"
        className="btn secondary"
        style={{ marginTop: 10, textDecoration: "none" }}
      >
        {t.adminTitle}
      </Link>
    </>
  );
}
