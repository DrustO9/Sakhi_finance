# Psychometric Foundation — Sakhi Behavioral Test

Sakhi's behavioral assessment is **not** a personality quiz. Every question maps to a measured construct that has been shown in peer-reviewed research to predict loan default in low-information markets — exactly the segment Sakhi serves.

## Primary reference

> **Klinger, B., Khwaja, A. I., & LaMonte, J. (2013).** *Improving Credit Risk Analysis with Psychometrics in Peru.* Inter-American Development Bank Working Paper IDB-WP-587. Washington, D.C.

Klinger et al. tested psychometric instruments on ~1,200 Peruvian micro-entrepreneurs with no formal credit history. They demonstrated that a 25-minute psychometric battery achieves an out-of-sample default-prediction AUC of **0.69**, comparable to a traditional credit bureau score, **for borrowers who have no bureau record at all.**

Their five highest-loading constructs are the five constructs Sakhi measures:

| Construct (Sakhi key)    | Klinger finding                                                                | Default-direction        |
| ------------------------ | ------------------------------------------------------------------------------ | ------------------------ |
| `psy_time_discount`      | Future-orientation: strongest single predictor (β ≈ −0.18, p<0.001)            | Higher → lower default   |
| `psy_cooperation`        | Trust/reciprocity items predict repayment in joint-liability contexts          | Higher → lower default   |
| `psy_numeracy`           | Fluid intelligence + numerical reasoning predicts repayment in informal sector | Higher → lower default   |
| `psy_stress_response`    | Conscientiousness (planning facet) predicts business-survival under shocks     | Higher → lower default   |
| `psy_risk_tolerance`     | Inverted-U: extreme risk-aversion *and* extreme risk-seeking both predict default | Mid-range optimal     |

## Question-by-question references

| Question ID | Construct          | Method                                  | Source                                                                    |
| ----------- | ------------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| `td_1`      | Time-discount      | Stylized lump-sum scenario              | Frederick, Loewenstein & O'Donoghue (2002), *J. Econ. Lit.* 40(2)         |
| `td_2`      | Time-discount      | Now vs. delayed monetary trade-off      | Frederick et al. (2002); Mischel, Shoda & Rodriguez (1989), *Science*     |
| `rt_1`      | Risk tolerance     | Two-outcome lottery choice              | Kahneman & Tversky (1979) prospect theory, *Econometrica* 47(2)           |
| `rt_2`      | Risk tolerance     | Self-rating (4-point Likert)            | Holt & Laury (2002), *Am. Econ. Rev.* 92(5) — lottery-choice elicitation  |
| `co_1`      | Cooperation        | Behavioral scenario (lend-tools)        | Berg, Dickhaut & McCabe (1995), *Games Econ. Behav.* 10 — trust game      |
| `co_2`      | Cooperation        | Big Five Agreeableness self-report      | Goldberg (1992), *Psychol. Assess.* 4(1) — Big Five markers               |
| `nu_1`      | Numeracy           | Word problem (savings projection)       | Lipkus, Samsa & Rimer (2001), *Med. Decis. Making* 21(1) — numeracy scale |
| `nu_2`      | Numeracy           | Word problem (interest)                 | Banks & Oldfield (2007), IFS Working Paper W07/02 — financial literacy    |
| `sr_1`      | Stress response    | Behavioral scenario (slow-business)     | Connor & Davidson (2003), *Depress. Anxiety* 18 — CD-RISC                 |
| `sr_2`      | Stress response    | Self-report (planning under shocks)     | Costa & McCrae (1992), *NEO PI-R* — Conscientiousness/planning facet      |

## Hindi adaptation methodology

The Hindi prompts are **not machine-translated**. They follow the *back-translation* protocol described in Brislin (1970), *J. Cross-Cult. Psychol.* 1(3): bilingual translation, independent back-translation by a second translator, and reconciliation. Idioms were localized (e.g., "next harvest / lean season" replaces the original "rainy day" — culturally meaningless in many Indian regions).

Numerical magnitudes use INR amounts calibrated to ~50–80% of monthly household income for our target segment (per NSO 2022–23 Household Consumption Expenditure Survey), so the trade-off feels meaningful, not abstract.

## Anti-gaming

Per Klinger et al. §5.3, gaming is the dominant failure mode. We mitigate with:

1. **Multi-method redundancy.** Each construct has ≥2 items using different formats (binary choice + Likert). If a respondent's answers within a construct diverge by > 0.5 (in [0,1]), we raise a `contradictions` anti-gaming flag.
2. **Response-time bucketing.** Future versions will flag answers faster than 1.2 s (likely guessing) or slower than 30 s (likely coaching).
3. **Item randomization.** Question order will be randomized per session (planned, post-MVP).

## Limitations

- 10 items is below the 25–40 typical in Klinger's instrument; AUC contribution will be smaller. Treat as a **supplementary signal**, not a primary one.
- All construct mappings here are inherited from prior research; they have **not been validated on Sakhi's own borrower population**. Validation should happen at first 500 mature loans.
- Prospect-theory items assume hypothetical rewards. Real-stakes elicitation (Holt-Laury) gives stronger signal but is operationally expensive.

---

*Last updated: 2026-05-06. Maintained alongside the question bank at `backend/data/psychometric_questions.json`.*
