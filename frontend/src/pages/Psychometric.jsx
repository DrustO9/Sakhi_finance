import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../App.jsx";
import { fetchQuestions, submitScore } from "../api/client";

export default function Psychometric() {
  const { t, lang, flow, setFlow } = useApp();
  const nav = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchQuestions(lang).then((data) => setQuestions(data.questions));
  }, [lang]);

  if (!questions.length) {
    return <div className="empty">Loading…</div>;
  }

  const q = questions[idx];
  const pct = ((idx + 1) / questions.length) * 100;
  const selected = answers[q.id];

  function pick(opt) {
    setAnswers({ ...answers, [q.id]: opt });
  }

  async function handleSubmit() {
    setBusy(true);
    setErr(null);
    try {
      const psych_responses = Object.entries(answers).map(([qid, ans]) => ({
        question_id: qid,
        answer: ans,
      }));
      const result = await submitScore({
        name: flow.name,
        age: flow.age,
        dependents: flow.dependents,
        language: lang,
        psych_responses,
        upi_features: flow.upiFeatures,
      });
      setFlow({ ...flow, psychResponses: psych_responses, result });
      nav("/result");
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  function playAudio() {
    const audio = new Audio(q.audio_url);
    audio.play().catch(() => {
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(q.prompt);
        u.lang = lang === "hi" ? "hi-IN" : "en-IN";
        window.speechSynthesis.speak(u);
      }
    });
  }

  const isLast = idx === questions.length - 1;
  const allAnswered = questions.every((qq) => answers[qq.id]);

  return (
    <>
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>

      <div className="card">
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
          {idx + 1} / {questions.length} · {q.construct}
        </div>
        <h2 style={{ fontSize: 16, lineHeight: 1.5 }}>{q.prompt}</h2>
        <button className="audio-btn" onClick={playAudio}>
          🔊 {t.listen}
        </button>

        {Object.entries(q.options).map(([key, label]) => (
          <button
            key={key}
            className={"option-btn" + (selected === key ? " selected" : "")}
            onClick={() => pick(key)}
          >
            <strong>{key}.</strong> {label}
          </button>
        ))}
      </div>

      {err && <div className="error">{err}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        {idx > 0 && (
          <button className="btn secondary" onClick={() => setIdx(idx - 1)}>
            ← {t.back}
          </button>
        )}
        {!isLast && (
          <button className="btn" disabled={!selected} onClick={() => setIdx(idx + 1)}>
            {t.next} →
          </button>
        )}
        {isLast && (
          <button className="btn" disabled={!allAnswered || busy} onClick={handleSubmit}>
            {busy ? t.scoring : t.submit}
          </button>
        )}
      </div>
    </>
  );
}
