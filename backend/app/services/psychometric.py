"""Psychometric question loader + response scorer.

Maps a list of {question_id, answer} responses into the 5 psychometric
construct scores the LightGBM model expects. Anti-gaming heuristics: same
construct measured >1 way; flag if responses contradict.
"""
from __future__ import annotations

import json
from pathlib import Path
from statistics import mean
from typing import Iterable

from app.config import DATA_DIR

_QUESTION_PATH = DATA_DIR / "psychometric_questions.json"


def load_questions() -> dict:
    return json.loads(_QUESTION_PATH.read_text(encoding="utf-8"))


def for_language(lang: str) -> dict:
    """Return the question bank with only the requested language's prompts inlined."""
    if lang not in ("en", "hi"):
        lang = "en"
    bank = load_questions()
    out_questions = []
    for q in bank["questions"]:
        out_questions.append({
            "id": q["id"],
            "construct": q["construct"],
            "type": q["type"],
            "prompt": q["prompts"][lang],
            "options": {k: v[lang] for k, v in q["options"].items()},
            "audio_url": f"/api/audio/{lang}/{q['id']}.wav",
        })
    return {
        "version": bank["version"],
        "language": lang,
        "research_basis": bank["research_basis"],
        "questions": out_questions,
    }


def score_responses(responses: Iterable[dict]) -> dict:
    """responses: [{'question_id': 'td_1', 'answer': 'A'}, ...]
    Returns 5 construct scores in [0,1].
    """
    bank = load_questions()
    by_id = {q["id"]: q for q in bank["questions"]}
    construct_scores: dict[str, list[float]] = {}
    contradictions = 0

    for r in responses:
        q = by_id.get(r["question_id"])
        if not q:
            continue
        score = q["scoring"].get(str(r["answer"]))
        if score is None:
            continue
        construct_scores.setdefault(q["construct"], []).append(score)

    # Contradiction: same construct, scores differ by > 0.5
    for construct, scores in construct_scores.items():
        if len(scores) >= 2 and (max(scores) - min(scores)) > 0.5:
            contradictions += 1

    out = {c: round(mean(s), 3) for c, s in construct_scores.items()}
    for c in ("psy_time_discount", "psy_risk_tolerance", "psy_cooperation",
              "psy_numeracy", "psy_stress_response"):
        out.setdefault(c, 0.5)

    out["_contradictions"] = contradictions
    return out
