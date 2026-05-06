"""
PD scoring + SHAP explanations + counterfactuals.

Loaded once at app startup. The Scorer holds:
  - the trained LightGBM booster
  - the feature list (in canonical order)
  - a SHAP TreeExplainer
  - a DiCE explainer (built lazily — slow to construct)
"""
from __future__ import annotations

import json
import threading
from dataclasses import dataclass, asdict
from typing import Optional

import lightgbm as lgb
import numpy as np
import pandas as pd
import shap

from app.config import (
    FEATURE_LIST_PATH,
    LOAN_AMOUNT_BY_TIER,
    PD_MODEL_PATH,
    TIER_THRESHOLDS,
    TRAIN_DATA_PATH,
)


@dataclass
class ScoreResult:
    pd_score: float
    tier: str
    loan_amount: int
    top_drivers: list[dict]
    feature_values: dict


def assign_tier(pd_score: float) -> str:
    for t, threshold in TIER_THRESHOLDS.items():
        if pd_score < threshold:
            return t
    return "D"


HUMAN_LABELS = {
    "avg_monthly_inflow": "Average monthly income",
    "income_regularity": "Income regularity",
    "savings_ratio": "Savings ratio",
    "merchant_diversity": "Merchant diversity",
    "discretionary_spend_ratio": "Discretionary spending share",
    "emi_count": "Existing EMIs",
    "atm_withdrawal_ratio": "Cash-withdrawal share",
    "p2p_transfer_ratio": "P2P transfer share",
    "psy_time_discount": "Patience (time-discount)",
    "psy_risk_tolerance": "Risk tolerance",
    "psy_cooperation": "Cooperation orientation",
    "psy_numeracy": "Numeracy",
    "psy_stress_response": "Stress response",
    "age": "Age",
    "dependents": "Dependents",
}


class Scorer:
    def __init__(self) -> None:
        self.booster = lgb.Booster(model_file=str(PD_MODEL_PATH))
        self.features: list[str] = json.loads(FEATURE_LIST_PATH.read_text())
        self.shap_explainer = shap.TreeExplainer(self.booster)
        self._dice_explainer = None
        self._dice_lock = threading.Lock()

    def _vec(self, payload: dict) -> pd.DataFrame:
        row = {f: float(payload.get(f, 0.0)) for f in self.features}
        return pd.DataFrame([row], columns=self.features)

    def score(self, payload: dict) -> ScoreResult:
        X = self._vec(payload)
        pd_score = float(self.booster.predict(X)[0])
        tier = assign_tier(pd_score)

        shap_values = self.shap_explainer.shap_values(X)
        if isinstance(shap_values, list):
            sv = shap_values[1][0]
        else:
            sv = shap_values[0]
        contribs = sorted(
            [(f, float(v), float(X.iloc[0][f])) for f, v in zip(self.features, sv)],
            key=lambda x: abs(x[1]),
            reverse=True,
        )
        top = [
            {
                "feature": f,
                "label": HUMAN_LABELS.get(f, f),
                "shap_value": v,
                "feature_value": fv,
                "direction": "increases_risk" if v > 0 else "decreases_risk",
            }
            for f, v, fv in contribs[:6]
        ]

        return ScoreResult(
            pd_score=round(pd_score, 4),
            tier=tier,
            loan_amount=LOAN_AMOUNT_BY_TIER[tier],
            top_drivers=top,
            feature_values={f: float(X.iloc[0][f]) for f in self.features},
        )

    def _ensure_dice(self):
        import dice_ml
        if self._dice_explainer is not None:
            return self._dice_explainer
        with self._dice_lock:
            if self._dice_explainer is not None:
                return self._dice_explainer
            df = pd.read_csv(TRAIN_DATA_PATH)

            class _Wrapper:
                def __init__(self, booster, features):
                    self.booster = booster
                    self.features = features
                def predict_proba(self, X):
                    if isinstance(X, np.ndarray):
                        X = pd.DataFrame(X, columns=self.features)
                    p = self.booster.predict(X[self.features])
                    return np.column_stack([1 - p, p])
                def predict(self, X):
                    if isinstance(X, np.ndarray):
                        X = pd.DataFrame(X, columns=self.features)
                    return (self.booster.predict(X[self.features]) > 0.5).astype(int)

            wrapper = _Wrapper(self.booster, self.features)
            d = dice_ml.Data(dataframe=df, continuous_features=self.features, outcome_name="default")
            m = dice_ml.Model(model=wrapper, backend="sklearn", model_type="classifier")
            self._dice_explainer = dice_ml.Dice(d, m, method="random")
            return self._dice_explainer

    def counterfactuals(self, payload: dict, n: int = 3) -> list[dict]:
        """Return up to n actionable improvement paths to flip default=1 -> 0."""
        explainer = self._ensure_dice()
        X = self._vec(payload)
        actionable = [
            "savings_ratio",
            "discretionary_spend_ratio",
            "atm_withdrawal_ratio",
            "income_regularity",
            "psy_time_discount",
            "psy_cooperation",
            "psy_numeracy",
            "emi_count",
        ]
        try:
            exp = explainer.generate_counterfactuals(
                X, total_CFs=n, desired_class=0, features_to_vary=actionable
            )
        except Exception as e:
            return [{"error": f"DiCE failed: {e}"}]

        cfs = exp.cf_examples_list[0].final_cfs_df
        if cfs is None or cfs.empty:
            return []

        out = []
        for _, row in cfs.iterrows():
            actions = []
            for f in actionable:
                cur = float(X.iloc[0][f])
                tgt = float(row[f])
                if abs(tgt - cur) < 1e-3:
                    continue
                actions.append({
                    "feature": f,
                    "label": HUMAN_LABELS.get(f, f),
                    "current": round(cur, 3),
                    "target": round(tgt, 3),
                    "delta": round(tgt - cur, 3),
                })
            actions.sort(key=lambda a: abs(a["delta"]), reverse=True)
            out.append({"actions": actions[:4]})
        return out


_scorer: Optional[Scorer] = None


def get_scorer() -> Scorer:
    global _scorer
    if _scorer is None:
        _scorer = Scorer()
    return _scorer
