"""Admin dashboard endpoints — list applications, model metrics, SHAP rationale."""
from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import MODELS_DIR
from app.db import Application, get_session

router = APIRouter()


@router.get("/applications")
def list_applications(limit: int = 50, db: Session = Depends(get_session)):
    rows = db.query(Application).order_by(Application.id.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "created_at": r.created_at.isoformat(),
            "language": r.language,
            "pd_score": r.pd_score,
            "tier": r.tier,
            "loan_amount": r.loan_amount,
            "model_version": r.model_version,
        }
        for r in rows
    ]


@router.get("/applications/{app_id}")
def get_application(app_id: int, db: Session = Depends(get_session)):
    r = db.query(Application).filter(Application.id == app_id).first()
    if not r:
        raise HTTPException(404, "Application not found")
    return {
        "id": r.id,
        "name": r.name,
        "age": r.age,
        "dependents": r.dependents,
        "language": r.language,
        "created_at": r.created_at.isoformat(),
        "upi_features": json.loads(r.upi_features_json or "{}"),
        "psychometric": json.loads(r.psychometric_json or "{}"),
        "pd_score": r.pd_score,
        "tier": r.tier,
        "loan_amount": r.loan_amount,
        "top_drivers": json.loads(r.shap_json or "[]"),
        "counterfactuals": json.loads(r.counterfactuals_json or "[]"),
        "model_version": r.model_version,
    }


@router.get("/metrics")
def metrics():
    p = MODELS_DIR / "metrics.json"
    if not p.exists():
        raise HTTPException(404, "Model metrics not generated yet. Run train_model.py.")
    return json.loads(p.read_text())
