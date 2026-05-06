const BASE = "/api";

export async function getHealth() {
  const r = await fetch(`${BASE}/health`);
  return r.json();
}

export async function fetchQuestions(lang) {
  const r = await fetch(`${BASE}/psychometric/questions?lang=${lang}`);
  return r.json();
}

export async function uploadUpi(file) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${BASE}/parse-upi`, { method: "POST", body: fd });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return r.json();
}

export async function submitScore(payload) {
  const r = await fetch(`${BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: "Scoring failed" }));
    throw new Error(err.detail || "Scoring failed");
  }
  return r.json();
}

export async function listApplications() {
  const r = await fetch(`${BASE}/admin/applications`);
  return r.json();
}

export async function getApplication(id) {
  const r = await fetch(`${BASE}/admin/applications/${id}`);
  return r.json();
}

export async function getMetrics() {
  const r = await fetch(`${BASE}/admin/metrics`);
  return r.json();
}
