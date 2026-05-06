"""
Synthetic data generator for Sakhi.

Produces:
  1. A labeled training table (CSV) of borrowers with engineered UPI features,
     psychometric scores, and a binary `default` label. Used to train LightGBM.
  2. A small set of synthetic UPI statement PDFs the parser can ingest end-to-end.

The default-generation process is structural, not random: PD is a logistic
function of the same features the model later learns from, plus noise. This
ensures the trained model has real signal to find without us hand-crafting
weights.
"""
from __future__ import annotations

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from faker import Faker
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import MODELS_DIR, PDF_DIR, TRAIN_DATA_PATH, FEATURE_LIST_PATH

fake = Faker("en_IN")
random.seed(42)
np.random.seed(42)
Faker.seed(42)

FEATURES = [
    "avg_monthly_inflow",
    "income_regularity",
    "savings_ratio",
    "merchant_diversity",
    "discretionary_spend_ratio",
    "emi_count",
    "atm_withdrawal_ratio",
    "p2p_transfer_ratio",
    "psy_time_discount",
    "psy_risk_tolerance",
    "psy_cooperation",
    "psy_numeracy",
    "psy_stress_response",
    "age",
    "dependents",
]


def _sample_applicant() -> dict:
    income = float(np.clip(np.random.lognormal(mean=10.1, sigma=0.55), 6000, 200000))
    regularity = float(np.clip(np.random.beta(5, 2), 0.1, 0.99))
    savings = float(np.clip(np.random.normal(0.18, 0.12), -0.1, 0.6))
    merchant_div = float(np.clip(np.random.normal(10, 4), 1, 30))
    discretionary = float(np.clip(np.random.beta(2, 5), 0.0, 0.7))
    emi_count = int(np.clip(np.random.poisson(0.6), 0, 5))
    atm_ratio = float(np.clip(np.random.beta(2, 6), 0.0, 0.7))
    p2p_ratio = float(np.clip(np.random.beta(3, 5), 0.0, 0.8))

    psy_td = float(np.clip(np.random.beta(4, 3), 0.05, 0.99))
    psy_risk = float(np.clip(np.random.beta(3, 3), 0.05, 0.99))
    psy_coop = float(np.clip(np.random.beta(5, 2), 0.05, 0.99))
    psy_num = float(np.clip(np.random.beta(4, 2), 0.05, 0.99))
    psy_stress = float(np.clip(np.random.beta(4, 3), 0.05, 0.99))

    age = int(np.clip(np.random.normal(34, 10), 21, 65))
    dependents = int(np.clip(np.random.poisson(1.6), 0, 6))

    return {
        "avg_monthly_inflow": income,
        "income_regularity": regularity,
        "savings_ratio": savings,
        "merchant_diversity": merchant_div,
        "discretionary_spend_ratio": discretionary,
        "emi_count": emi_count,
        "atm_withdrawal_ratio": atm_ratio,
        "p2p_transfer_ratio": p2p_ratio,
        "psy_time_discount": psy_td,
        "psy_risk_tolerance": psy_risk,
        "psy_cooperation": psy_coop,
        "psy_numeracy": psy_num,
        "psy_stress_response": psy_stress,
        "age": age,
        "dependents": dependents,
    }


def _label(row: dict) -> int:
    """Generative truth: PD is a logit of features. Model then learns it back."""
    z = (
        2.8
        + -2.5 * row["income_regularity"]
        + -3.0 * row["savings_ratio"]
        + -1.6 * row["psy_time_discount"]
        + -1.2 * row["psy_cooperation"]
        + -1.0 * row["psy_stress_response"]
        + 1.5 * row["discretionary_spend_ratio"]
        + 0.8 * row["atm_withdrawal_ratio"]
        + 0.45 * row["emi_count"]
        + -0.000004 * row["avg_monthly_inflow"]
        + 0.12 * row["dependents"]
        + np.random.normal(0, 0.45)
    )
    pd_true = 1.0 / (1.0 + np.exp(-z))
    return int(np.random.random() < pd_true)


def build_training_table(n: int = 6000) -> pd.DataFrame:
    rows = []
    for _ in range(n):
        r = _sample_applicant()
        r["default"] = _label(r)
        rows.append(r)
    df = pd.DataFrame(rows)
    return df


def _generate_transactions(profile: dict, months: int = 6) -> list[dict]:
    """Build transaction list consistent with the applicant's feature profile."""
    txs = []
    today = datetime(2026, 5, 1)
    start = today - timedelta(days=months * 30)

    monthly_inflow = profile["avg_monthly_inflow"]
    salary_day_jitter = 1.0 - profile["income_regularity"]
    savings = profile["savings_ratio"]
    monthly_outflow = monthly_inflow * (1 - savings)

    merchants_food = ["Zomato", "Swiggy", "More Supermarket", "Reliance Fresh"]
    merchants_util = ["Airtel Recharge", "BSES Delhi", "Tata Power"]
    merchants_disc = ["BookMyShow", "Amazon", "Flipkart", "Myntra"]
    merchants_p2p = ["Ramesh Kumar", "Sita Devi", "Anand S", "Priya P"]

    for m in range(months):
        month_start = start + timedelta(days=30 * m)

        salary_offset = int(np.random.normal(2, salary_day_jitter * 8))
        salary_date = month_start + timedelta(days=max(1, min(28, 2 + salary_offset)))
        txs.append({
            "date": salary_date,
            "narration": "UPI/CR/SALARY/HRMS",
            "credit": round(monthly_inflow, 2),
            "debit": 0.0,
        })

        n_disc = max(1, int(8 + profile["discretionary_spend_ratio"] * 20))
        for _ in range(n_disc):
            d = month_start + timedelta(days=random.randint(0, 29))
            amt = round(np.random.uniform(80, 1500) * (0.3 + profile["discretionary_spend_ratio"]), 2)
            m_pool = random.choice([merchants_food, merchants_disc])
            txs.append({
                "date": d,
                "narration": f"UPI/DR/{random.choice(m_pool)}",
                "credit": 0.0,
                "debit": amt,
            })

        for _ in range(2):
            d = month_start + timedelta(days=random.randint(0, 29))
            txs.append({
                "date": d,
                "narration": f"UPI/DR/{random.choice(merchants_util)}",
                "credit": 0.0,
                "debit": round(np.random.uniform(300, 2500), 2),
            })

        n_p2p = int(profile["p2p_transfer_ratio"] * 12)
        for _ in range(n_p2p):
            d = month_start + timedelta(days=random.randint(0, 29))
            txs.append({
                "date": d,
                "narration": f"UPI/DR/{random.choice(merchants_p2p)}",
                "credit": 0.0,
                "debit": round(np.random.uniform(100, 3000), 2),
            })

        n_atm = int(profile["atm_withdrawal_ratio"] * 8)
        for _ in range(n_atm):
            d = month_start + timedelta(days=random.randint(0, 29))
            txs.append({
                "date": d,
                "narration": "ATM/CASH WITHDRAWAL",
                "credit": 0.0,
                "debit": round(np.random.choice([500, 1000, 2000, 5000]), 2),
            })

        for _ in range(profile["emi_count"]):
            d = month_start + timedelta(days=random.randint(3, 7))
            txs.append({
                "date": d,
                "narration": "ACH/EMI/HDFC LOAN",
                "credit": 0.0,
                "debit": round(np.random.uniform(2000, 12000), 2),
            })

        target_outflow = monthly_outflow
        current_outflow = sum(t["debit"] for t in txs if t["date"].month == month_start.month)
        gap = target_outflow - current_outflow
        if gap > 500:
            txs.append({
                "date": month_start + timedelta(days=random.randint(10, 25)),
                "narration": "UPI/DR/More Supermarket",
                "credit": 0.0,
                "debit": round(gap, 2),
            })

    txs.sort(key=lambda x: x["date"])
    return txs


def render_pdf(path: Path, holder_name: str, vpa: str, txs: list[dict]) -> None:
    doc = SimpleDocTemplate(str(path), pagesize=A4, title="UPI Statement")
    styles = getSampleStyleSheet()
    story = []
    story.append(Paragraph(f"<b>UPI Account Statement</b>", styles["Title"]))
    story.append(Paragraph(f"Account Holder: {holder_name}", styles["Normal"]))
    story.append(Paragraph(f"VPA: {vpa}", styles["Normal"]))
    story.append(Paragraph(
        f"Period: {txs[0]['date'].strftime('%d-%b-%Y')} to {txs[-1]['date'].strftime('%d-%b-%Y')}",
        styles["Normal"],
    ))
    story.append(Spacer(1, 12))

    data = [["Date", "Narration", "Debit (INR)", "Credit (INR)"]]
    for t in txs:
        data.append([
            t["date"].strftime("%d-%m-%Y"),
            t["narration"][:48],
            f"{t['debit']:.2f}" if t["debit"] else "",
            f"{t['credit']:.2f}" if t["credit"] else "",
        ])

    tbl = Table(data, colWidths=[70, 260, 80, 80], repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#222244")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
        ("ALIGN", (2, 0), (3, -1), "RIGHT"),
    ]))
    story.append(tbl)
    doc.build(story)


def generate_sample_pdfs(n: int = 4) -> list[Path]:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    paths = []
    archetypes = [
        ("good", {"income_regularity": 0.95, "savings_ratio": 0.32, "discretionary_spend_ratio": 0.15,
                  "atm_withdrawal_ratio": 0.05, "p2p_transfer_ratio": 0.2, "emi_count": 0,
                  "avg_monthly_inflow": 38000, "merchant_diversity": 12}),
        ("borderline", {"income_regularity": 0.6, "savings_ratio": 0.08, "discretionary_spend_ratio": 0.35,
                        "atm_withdrawal_ratio": 0.18, "p2p_transfer_ratio": 0.4, "emi_count": 1,
                        "avg_monthly_inflow": 22000, "merchant_diversity": 8}),
        ("risky", {"income_regularity": 0.3, "savings_ratio": -0.05, "discretionary_spend_ratio": 0.55,
                   "atm_withdrawal_ratio": 0.4, "p2p_transfer_ratio": 0.6, "emi_count": 2,
                   "avg_monthly_inflow": 15000, "merchant_diversity": 5}),
        ("excellent", {"income_regularity": 0.98, "savings_ratio": 0.4, "discretionary_spend_ratio": 0.1,
                       "atm_withdrawal_ratio": 0.03, "p2p_transfer_ratio": 0.1, "emi_count": 0,
                       "avg_monthly_inflow": 65000, "merchant_diversity": 18}),
    ]

    for label, profile in archetypes[:n]:
        txs = _generate_transactions(profile, months=6)
        name = fake.name()
        vpa = name.split()[0].lower() + "@oksbi"
        path = PDF_DIR / f"sample_{label}.pdf"
        render_pdf(path, name, vpa, txs)
        paths.append(path)
    return paths


def main():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    print("Generating training table...")
    df = build_training_table(n=6000)
    df.to_csv(TRAIN_DATA_PATH, index=False)
    print(f"  wrote {TRAIN_DATA_PATH} ({len(df)} rows, default rate = {df['default'].mean():.3f})")

    with open(FEATURE_LIST_PATH, "w") as f:
        json.dump(FEATURES, f, indent=2)
    print(f"  wrote {FEATURE_LIST_PATH}")

    print("Generating sample UPI PDFs...")
    paths = generate_sample_pdfs(n=4)
    for p in paths:
        print(f"  wrote {p.name}")


if __name__ == "__main__":
    main()
