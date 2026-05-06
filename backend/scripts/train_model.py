"""Train the Sakhi LightGBM PD model on synthetic data."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import (
    FEATURE_LIST_PATH,
    MODELS_DIR,
    PD_MODEL_PATH,
    TRAIN_DATA_PATH,
)


def main() -> None:
    if not TRAIN_DATA_PATH.exists():
        print(f"Training data not found at {TRAIN_DATA_PATH}. Run generate_synthetic_data.py first.")
        sys.exit(1)

    df = pd.read_csv(TRAIN_DATA_PATH)
    features = json.loads(FEATURE_LIST_PATH.read_text())
    X = df[features]
    y = df["default"]

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    params = {
        "objective": "binary",
        "metric": "auc",
        "learning_rate": 0.05,
        "num_leaves": 31,
        "min_data_in_leaf": 30,
        "feature_fraction": 0.9,
        "bagging_fraction": 0.9,
        "bagging_freq": 5,
        "verbose": -1,
    }
    dtrain = lgb.Dataset(X_tr, y_tr)
    dvalid = lgb.Dataset(X_te, y_te, reference=dtrain)
    model = lgb.train(
        params,
        dtrain,
        num_boost_round=400,
        valid_sets=[dtrain, dvalid],
        valid_names=["train", "valid"],
        callbacks=[lgb.early_stopping(20), lgb.log_evaluation(50)],
    )

    p_te = model.predict(X_te)
    auc = roc_auc_score(y_te, p_te)
    print(f"\nTest AUC: {auc:.4f}")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model.save_model(str(PD_MODEL_PATH))
    print(f"Model written to {PD_MODEL_PATH}")

    metrics = {
        "auc": float(auc),
        "n_train": int(len(X_tr)),
        "n_test": int(len(X_te)),
        "default_rate_train": float(y_tr.mean()),
        "default_rate_test": float(y_te.mean()),
        "feature_importance": {
            f: float(v) for f, v in zip(features, model.feature_importance(importance_type="gain"))
        },
    }
    (MODELS_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2))
    print(f"Metrics written to {MODELS_DIR / 'metrics.json'}")


if __name__ == "__main__":
    main()
