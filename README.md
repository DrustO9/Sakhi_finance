# Sakhi — Credit for Bharat

> Alternative credit scoring for the 250M+ Indians excluded by the formal credit system.
> No CIBIL, no documents — just UPI patterns + a 10-question behavioral assessment.

This is the **MVP** referenced in `Uco.md` (the BharatScore v2 feature spec, rebranded as **Sakhi**).
It implements the three Tier-1 hackathon features end-to-end:

1. **UPI Cash-Flow Parser** — upload a PDF statement, get 8 financial-behavior features in seconds
2. **Counterfactual Explanations** — every Tier C/D rejection comes with 3 actionable improvement paths (DiCE)
3. **Vernacular Psychometric Test** — 10-item EN/HI test grounded in Klinger et al. (2013); see [`docs/PSYCHOMETRIC_RESEARCH.md`](docs/PSYCHOMETRIC_RESEARCH.md)

Plus an admin dashboard with SHAP visualization and model metrics.

## Stack

- **Backend:** FastAPI · LightGBM · SHAP · DiCE · pdfplumber · SQLite
- **Frontend:** React 18 · Vite · mobile-first (460 px frame)
- **Audio:** eSpeak NG (open source, supports Hindi)
- **No external services required.** Runs fully offline.

## Setup

**👉 New here? Follow [SETUP.md](SETUP.md)** — step-by-step clone-to-run guide for teammates, with troubleshooting.

Quick version:

```bash
# Clone
git clone git@github.com:DrustO9/Sakhi_finance.git && cd Sakhi_finance

# Backend (one terminal)
cd backend && python -m venv .venv
# activate venv: Windows = .venv\Scripts\activate ; macOS/Linux = source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (another terminal)
cd frontend && npm install && npm run dev
```

Then open **http://localhost:5173**. The model and sample PDFs are committed to the repo, so no training step is needed.

## Demo path (for the pitch)

1. **Home** → tap *Start your application*
2. **Applicant** → name + age + dependents
3. **UPI Upload** → use one of the sample PDFs at `backend/data/synthetic_pdfs/`:
   - `sample_excellent.pdf` → Tier A
   - `sample_good.pdf` → Tier A/B
   - `sample_borderline.pdf` → Tier C (counterfactuals trigger)
   - `sample_risky.pdf` → Tier D
4. **Psychometric** → 10 questions, EN/HI toggle in the top-bar, audio button per question
5. **Result** → 100-point score, tier, eligible loan amount, top SHAP drivers, counterfactual paths
6. **Admin** (link from home or `/admin`) → all applications + per-decision SHAP breakdown + model AUC

## Project layout

```
sakhi/
├── backend/
│   ├── app/                    FastAPI app
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── routers/{score,admin}.py
│   │   └── services/{upi_parser,psychometric,scoring}.py
│   ├── data/
│   │   ├── psychometric_questions.json   (EN + HI, with research refs)
│   │   ├── synthetic_pdfs/               (sample UPI statements)
│   │   ├── audio/{en,hi}/                (pre-generated WAVs)
│   │   └── models/                       (pd_model.lgb, metrics.json)
│   ├── scripts/{generate_synthetic_data,train_model,generate_audio}.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/{Home,Applicant,UpiUpload,Psychometric,Result,Admin}.jsx
│   │   ├── api/client.js
│   │   ├── i18n/strings.js
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── ARCHITECTURE.md
│   └── PSYCHOMETRIC_RESEARCH.md
└── README.md (you are here)
```

## What this MVP **does not** include

The full Sakhi vision (see `../Uco.md`) has 9 features. This MVP ships the 3 Tier-1 ones. Tier-2 (voice assessment, social graph, nudge engine) and Tier-3 (SHG mode, default insurance pool, MSME track) are on the roadmap.

We also deliberately use **synthetic data** — the model is trained on 6,000 generated applicants whose default labels are a known function of their features. This proves the pipeline; production calibration requires real loan-performance data.
