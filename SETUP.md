# Sakhi — Local Setup Guide

This is everything a teammate needs to clone, install, and run Sakhi on their own laptop in ~10 minutes.

---

## Prerequisites

You need three things installed system-wide. Pick whichever installer suits your OS.

| Tool        | Minimum  | Check version with        | Where to get it                                       |
| ----------- | -------- | ------------------------- | ----------------------------------------------------- |
| **Python**  | 3.11+    | `python --version`        | https://www.python.org/downloads/                     |
| **Node.js** | 18+      | `node --version`          | https://nodejs.org/                                   |
| **Git**     | any      | `git --version`           | https://git-scm.com/downloads                         |

> **Windows users:** during the Python installer, **check the box "Add Python to PATH"**. Otherwise `python` won't work from the terminal.

---

## 1. Clone the repo

```bash
git clone git@github.com:DrustO9/Sakhi_finance.git
cd Sakhi_finance
```

If you don't have SSH keys set up on your GitHub account, use HTTPS instead:

```bash
git clone https://github.com/DrustO9/Sakhi_finance.git
```

---

## 2. Backend setup (one-time)

```bash
cd backend

# Create a Python virtual environment (so deps don't pollute your system)
python -m venv .venv

# Activate it
#   Windows (PowerShell):
.venv\Scripts\Activate.ps1
#   Windows (Git Bash / cmd.exe):
.venv\Scripts\activate
#   macOS / Linux:
source .venv/bin/activate

# Install Python dependencies (~3 minutes)
pip install -r requirements.txt
```

You **do not need to retrain the model** — `pd_model.lgb`, `features.json`, `metrics.json`, and `train.csv` are already in the repo. The 4 sample UPI PDFs are also committed at `data/synthetic_pdfs/`.

> **Optional:** if you want fresh data or to tweak the synthetic generator, run:
> ```bash
> python scripts/generate_synthetic_data.py    # rebuild training table + sample PDFs
> python scripts/train_model.py                # retrain LightGBM, writes new pd_model.lgb
> ```

---

## 3. Frontend setup (one-time)

In a **new terminal** (leave the backend terminal alone):

```bash
cd Sakhi_finance/frontend
npm install        # ~1 minute
```

---

## 4. Run the app (every time)

You need **two terminals** running in parallel.

**Terminal 1 — backend:**
```bash
cd Sakhi_finance/backend

# Re-activate venv (only needed once per terminal session)
#   Windows:    .venv\Scripts\activate
#   macOS/Linux: source .venv/bin/activate

uvicorn app.main:app --reload --port 8000
```
You should see `Uvicorn running on http://127.0.0.1:8000`.

**Terminal 2 — frontend:**
```bash
cd Sakhi_finance/frontend
npm run dev
```
You should see `Local: http://localhost:5173/`.

**Open** **http://localhost:5173** in your browser — that's the app.

---

## 5. Demo flow

1. **Home** → tap *Start your application*
2. **Applicant** → name + age + dependents → Next
3. **UPI Upload** → click *Choose PDF*, pick one from `backend/data/synthetic_pdfs/`:
   - `sample_excellent.pdf` → Tier A/B (~10% PD)
   - `sample_good.pdf` → Tier B
   - `sample_borderline.pdf` → Tier C (counterfactuals appear)
   - `sample_risky.pdf` → Tier D (counterfactuals + improvement paths)
4. **Psychometric** → 10 questions. Toggle EN/हिं in the top-right. Click 🔊 to hear the question read aloud (uses your browser's built-in TTS — no install needed).
5. **Result** → 100-point score, tier, eligible loan amount, top SHAP drivers, counterfactual paths, behavioral profile.
6. **Admin** → click the *Admin Dashboard* button on the home screen, or visit `http://localhost:5173/admin` directly. Click any application for the full SHAP breakdown. Switch to the *Model Metrics* tab for AUC + feature importance.

---

## Troubleshooting

| Symptom                                         | Fix                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `python: command not found`                     | Use `python3` instead, or re-install Python with "Add to PATH" checked.              |
| `ModuleNotFoundError: No module named 'app'`    | Make sure you're running uvicorn from the `backend/` directory, not `backend/app/`.  |
| `Port 8000 is already in use`                   | Either stop the other process, or run uvicorn on another port: `--port 8001` (and update `frontend/vite.config.js` to match). |
| `Port 5173 is already in use`                   | Vite will auto-pick `5174`. Just open whichever port it prints.                       |
| Frontend loads but `Network Error` on upload    | Backend isn't running. Check Terminal 1 for crashes.                                 |
| Audio button does nothing                       | Browser TTS may be muted or unavailable. Audio is non-essential — questions still display as text. |
| `pip install` fails on `lightgbm` (Windows)     | Install Microsoft Visual C++ Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/ |
| DiCE counterfactual error in the Result page   | Confirm `backend/data/models/train.csv` exists. If not, run `python scripts/generate_synthetic_data.py`. |

---

## Stopping the app

- In each terminal: **Ctrl+C** to stop the server.
- To deactivate the Python venv: just type `deactivate` in the backend terminal.

---

## Project structure (orientation)

```
Sakhi_finance/
├── backend/         FastAPI + LightGBM + SHAP + DiCE
│   ├── app/         (server code)
│   ├── data/        (model, sample PDFs, question bank)
│   └── scripts/     (data gen, training)
├── frontend/        React 18 + Vite mobile-first UI
│   └── src/
├── docs/
│   ├── ARCHITECTURE.md            (system overview)
│   └── PSYCHOMETRIC_RESEARCH.md   (Klinger 2013 + research citations)
├── README.md        (project overview)
└── SETUP.md         (you are here)
```

Open `docs/ARCHITECTURE.md` for an overview of how data flows through the system, and `docs/PSYCHOMETRIC_RESEARCH.md` for the academic basis of the behavioral test.
