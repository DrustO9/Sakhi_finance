from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = DATA_DIR / "models"
PDF_DIR = DATA_DIR / "synthetic_pdfs"
AUDIO_DIR = DATA_DIR / "audio"
DB_PATH = DATA_DIR / "sakhi.db"

PD_MODEL_PATH = MODELS_DIR / "pd_model.lgb"
FEATURE_LIST_PATH = MODELS_DIR / "features.json"
TRAIN_DATA_PATH = MODELS_DIR / "train.csv"

TIER_THRESHOLDS = {
    "A": 0.10,
    "B": 0.20,
    "C": 0.35,
    "D": 1.01,
}

LOAN_AMOUNT_BY_TIER = {
    "A": 100000,
    "B": 50000,
    "C": 20000,
    "D": 0,
}
