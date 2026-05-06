"""
UPI bank statement PDF parser.

Reads a PDF, extracts the transaction table (Date / Narration / Debit / Credit),
and aggregates it into the same feature vector the LightGBM model expects.

Aggregation logic mirrors the synthetic generator's signal definitions:
- avg_monthly_inflow:   mean of monthly credit totals
- income_regularity:    1 - (std of salary-credit gap days / 15), clipped to [0,1]
- savings_ratio:        (inflow - outflow) / inflow
- merchant_diversity:   unique narration prefixes / month
- discretionary_spend_ratio: spend on food/entertainment merchants / total debit
- emi_count:            distinct months containing an EMI/loan keyword
- atm_withdrawal_ratio: ATM debit / total debit
- p2p_transfer_ratio:   P2P-style narrations / total debit
"""
from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from statistics import mean, pstdev
from typing import Optional

import pdfplumber

DATE_RX = re.compile(r"^\d{2}-\d{2}-\d{4}$")
DISCRETIONARY_KW = ("zomato", "swiggy", "bookmyshow", "amazon", "flipkart", "myntra")
P2P_HINTS = ("kumar", "devi", "anand", "priya", "ramesh", "sita")
EMI_KW = ("emi", "loan", "ach/")
ATM_KW = ("atm",)
SALARY_KW = ("salary", "hrms", "payroll")


@dataclass
class Transaction:
    date: datetime
    narration: str
    debit: float
    credit: float


@dataclass
class UPIFeatures:
    avg_monthly_inflow: float
    income_regularity: float
    savings_ratio: float
    merchant_diversity: float
    discretionary_spend_ratio: float
    emi_count: int
    atm_withdrawal_ratio: float
    p2p_transfer_ratio: float
    raw_tx_count: int
    months_observed: int


def _to_float(v: Optional[str]) -> float:
    if not v:
        return 0.0
    v = v.replace(",", "").strip()
    if not v:
        return 0.0
    try:
        return float(v)
    except ValueError:
        return 0.0


def parse_pdf(path: Path) -> list[Transaction]:
    txs: list[Transaction] = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables() or []:
                for row in table:
                    if not row or not row[0]:
                        continue
                    cell0 = row[0].strip()
                    if not DATE_RX.match(cell0):
                        continue
                    date = datetime.strptime(cell0, "%d-%m-%Y")
                    narration = (row[1] or "").strip()
                    debit = _to_float(row[2] if len(row) > 2 else None)
                    credit = _to_float(row[3] if len(row) > 3 else None)
                    txs.append(Transaction(date, narration, debit, credit))
    return txs


def _kw(narration: str, keywords: tuple[str, ...]) -> bool:
    n = narration.lower()
    return any(k in n for k in keywords)


def aggregate(txs: list[Transaction]) -> UPIFeatures:
    if not txs:
        return UPIFeatures(0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

    monthly_in: dict[tuple[int, int], float] = defaultdict(float)
    monthly_out: dict[tuple[int, int], float] = defaultdict(float)
    monthly_merchants: dict[tuple[int, int], set] = defaultdict(set)
    monthly_emi: dict[tuple[int, int], bool] = defaultdict(bool)
    salary_dates: list[int] = []

    total_debit = 0.0
    disc_debit = 0.0
    atm_debit = 0.0
    p2p_debit = 0.0

    for t in txs:
        ym = (t.date.year, t.date.month)
        if t.credit > 0:
            monthly_in[ym] += t.credit
            if _kw(t.narration, SALARY_KW):
                salary_dates.append(t.date.day)
        if t.debit > 0:
            monthly_out[ym] += t.debit
            total_debit += t.debit
            prefix = t.narration.split("/")[-1][:20]
            monthly_merchants[ym].add(prefix.lower())
            if _kw(t.narration, DISCRETIONARY_KW):
                disc_debit += t.debit
            if _kw(t.narration, ATM_KW):
                atm_debit += t.debit
            if _kw(t.narration, P2P_HINTS):
                p2p_debit += t.debit
            if _kw(t.narration, EMI_KW):
                monthly_emi[ym] = True

    months = sorted(set(monthly_in) | set(monthly_out))
    n_months = max(1, len(months))

    inflows = [monthly_in.get(m, 0) for m in months]
    outflows = [monthly_out.get(m, 0) for m in months]
    avg_inflow = mean(inflows) if inflows else 0
    total_in = sum(inflows)
    total_out = sum(outflows)
    savings_ratio = (total_in - total_out) / total_in if total_in > 0 else 0

    if len(salary_dates) >= 2:
        regularity = max(0.0, 1.0 - pstdev(salary_dates) / 15.0)
    elif len(salary_dates) == 1:
        regularity = 0.5
    else:
        regularity = 0.0
    regularity = min(1.0, regularity)

    merchant_div = mean(len(s) for s in monthly_merchants.values()) if monthly_merchants else 0

    return UPIFeatures(
        avg_monthly_inflow=round(avg_inflow, 2),
        income_regularity=round(regularity, 3),
        savings_ratio=round(savings_ratio, 3),
        merchant_diversity=round(merchant_div, 2),
        discretionary_spend_ratio=round(disc_debit / total_debit, 3) if total_debit else 0,
        emi_count=sum(1 for v in monthly_emi.values() if v),
        atm_withdrawal_ratio=round(atm_debit / total_debit, 3) if total_debit else 0,
        p2p_transfer_ratio=round(p2p_debit / total_debit, 3) if total_debit else 0,
        raw_tx_count=len(txs),
        months_observed=n_months,
    )


def parse_and_aggregate(path: Path) -> UPIFeatures:
    return aggregate(parse_pdf(path))
