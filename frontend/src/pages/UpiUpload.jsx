import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../App.jsx";
import { uploadUpi } from "../api/client";
import { FEATURE_LABELS } from "../i18n/strings";

export default function UpiUpload() {
  const { t, lang, flow, setFlow } = useApp();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const features = await uploadUpi(f);
      setFlow({ ...flow, upiFeatures: features });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const labels = FEATURE_LABELS[lang];
  const features = flow.upiFeatures;

  return (
    <>
      <div className="progress"><div style={{ width: "40%" }} /></div>

      <div className="card">
        <h2>{t.upiUpload}</h2>
        <p>{t.upiUploadSub}</p>
      </div>

      {!features && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={handleFile}
            style={{ display: "none" }}
          />
          <button className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? t.parsing : `📄 ${t.chooseFile}`}
          </button>
          {err && <div className="error" style={{ marginTop: 10 }}>{err}</div>}
        </>
      )}

      {features && (
        <>
          <div className="card">
            <h2>✓ {t.parsedTitle}</h2>
            <div className="feature-row">
              <span>{labels.avg_monthly_inflow}</span>
              <span className="v">₹ {features.avg_monthly_inflow.toLocaleString("en-IN")}</span>
            </div>
            <div className="feature-row">
              <span>{labels.income_regularity}</span>
              <span className="v">{(features.income_regularity * 100).toFixed(0)}%</span>
            </div>
            <div className="feature-row">
              <span>{labels.savings_ratio}</span>
              <span className="v">{(features.savings_ratio * 100).toFixed(0)}%</span>
            </div>
            <div className="feature-row">
              <span>{labels.merchant_diversity}</span>
              <span className="v">{features.merchant_diversity}</span>
            </div>
            <div className="feature-row">
              <span>{labels.discretionary_spend_ratio}</span>
              <span className="v">{(features.discretionary_spend_ratio * 100).toFixed(0)}%</span>
            </div>
            <div className="feature-row">
              <span>{labels.emi_count}</span>
              <span className="v">{features.emi_count}</span>
            </div>
            <div className="feature-row">
              <span>Transactions</span>
              <span className="v">{features.raw_tx_count} ({features.months_observed} mo)</span>
            </div>
          </div>
          <button className="btn" onClick={() => nav("/test")}>
            {t.next} →
          </button>
        </>
      )}
    </>
  );
}
