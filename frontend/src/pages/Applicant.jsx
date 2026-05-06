import { useNavigate } from "react-router-dom";
import { useApp } from "../App.jsx";

export default function Applicant() {
  const { t, flow, setFlow } = useApp();
  const nav = useNavigate();

  return (
    <>
      <div className="progress"><div style={{ width: "20%" }} /></div>
      <div className="card">
        <h2>{t.applicantInfo}</h2>
        <label className="label">{t.yourName}</label>
        <input className="input" value={flow.name}
          onChange={(e) => setFlow({ ...flow, name: e.target.value })} />

        <label className="label">{t.age}</label>
        <input className="input" type="number" value={flow.age}
          onChange={(e) => setFlow({ ...flow, age: parseInt(e.target.value || 0) })} />

        <label className="label">{t.dependents}</label>
        <input className="input" type="number" value={flow.dependents}
          onChange={(e) => setFlow({ ...flow, dependents: parseInt(e.target.value || 0) })} />
      </div>
      <button className="btn" disabled={!flow.name} onClick={() => nav("/upi")}>
        {t.next} →
      </button>
    </>
  );
}
