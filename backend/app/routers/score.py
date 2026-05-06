"""Scoring + UPI upload + counterfactuals endpoints."""
from __future__ import annotations

import json
import shutil
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import Application, get_session
from app.services.psychometric import score_responses
from app.services.scoring import get_scorer
from app.services.upi_parser import parse_and_aggregate

router = APIRouter()


class PsychResponse(BaseModel):
    question_id: str
    answer: str


class ScoreRequest(BaseModel):
    name: str
    age: int = 30
    dependents: int = 1
    language: str = "en"
    psych_responses: list[PsychResponse] = []
    upi_features: Optional[dict] = None


@router.post("/parse-upi")
async def parse_upi(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Upload a PDF file")
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)
    try:
        feats = parse_and_aggregate(tmp_path)
    finally:
        tmp_path.unlink(missing_ok=True)
    if feats.raw_tx_count == 0:
        raise HTTPException(status_code=422, detail="No transactions found. Is this a UPI statement?")
    return {
        "avg_monthly_inflow": feats.avg_monthly_inflow,
        "income_regularity": feats.income_regularity,
        "savings_ratio": feats.savings_ratio,
        "merchant_diversity": feats.merchant_diversity,
        "discretionary_spend_ratio": feats.discretionary_spend_ratio,
        "emi_count": feats.emi_count,
        "atm_withdrawal_ratio": feats.atm_withdrawal_ratio,
        "p2p_transfer_ratio": feats.p2p_transfer_ratio,
        "raw_tx_count": feats.raw_tx_count,
        "months_observed": feats.months_observed,
    }


@router.post("/score")
def score(req: ScoreRequest, db: Session = Depends(get_session)):
    scorer = get_scorer()
    psy = score_responses([r.dict() for r in req.psych_responses])
    payload = {
        "age": req.age,
        "dependents": req.dependents,
        **(req.upi_features or {}),
        "psy_time_discount": psy.get("psy_time_discount", 0.5),
        "psy_risk_tolerance": psy.get("psy_risk_tolerance", 0.5),
        "psy_cooperation": psy.get("psy_cooperation", 0.5),
        "psy_numeracy": psy.get("psy_numeracy", 0.5),
        "psy_stress_response": psy.get("psy_stress_response", 0.5),
    }
    result = scorer.score(payload)

    cfs: list = []
    if result.tier in ("C", "D"):
        cfs = scorer.counterfactuals(payload, n=3)

    app_row = Application(
        name=req.name,
        age=req.age,
        dependents=req.dependents,
        language=req.language,
        upi_features_json=json.dumps(req.upi_features or {}),
        psychometric_json=json.dumps(psy),
        pd_score=result.pd_score,
        tier=result.tier,
        loan_amount=result.loan_amount,
        shap_json=json.dumps(result.top_drivers),
        counterfactuals_json=json.dumps(cfs),
    )
    db.add(app_row)
    db.commit()
    db.refresh(app_row)

    return {
        "application_id": app_row.id,
        "pd_score": result.pd_score,
        "tier": result.tier,
        "loan_amount": result.loan_amount,
        "top_drivers": result.top_drivers,
        "counterfactuals": cfs,
        "psychometric_breakdown": {k: v for k, v in psy.items() if not k.startswith("_")},
        "anti_gaming_flags": {"contradictions": psy.get("_contradictions", 0)},
    }
