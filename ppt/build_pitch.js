/**
 * Sakhi pitch deck — UCO Bank hackathon panel
 *
 * Layout: 16:9 (10 x 5.625")
 * Palette: deep-purple primary, saffron accent, cream background, dark text.
 * Motif: saffron circle number badges + 0.10" purple sidebar on cards.
 * Type pairing: Georgia (headers) + Calibri (body).
 */
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Fa = require("react-icons/fa");
const Hi = require("react-icons/hi");

// ── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  primary:    "6E2A9F",   // app primary purple
  primaryDk:  "4A1A6F",   // deeper purple — title backgrounds
  primaryLt:  "F5EDFB",   // pale purple — subtle fills
  accent:     "F4A261",   // saffron
  accentDk:   "C97A35",   // saffron deep — text on saffron
  bg:         "FAF7FB",   // cream-tinted background
  card:       "FFFFFF",
  text:       "1A1A2E",
  muted:      "6C6C80",
  border:     "ECE4F1",
  good:       "2A9D8F",
  warn:       "E76F51",
  white:      "FFFFFF",
};

const F_HEAD = "Georgia";
const F_BODY = "Calibri";

// ── Icon helper ─────────────────────────────────────────────────────────────
async function icon(IconComponent, color = "#" + C.primary, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

// ── Reusable layout primitives ──────────────────────────────────────────────
function contentBg(slide) {
  slide.background = { color: C.bg };
}

function darkBg(slide) {
  slide.background = { color: C.primaryDk };
}

function pageHeader(slide, kicker, title) {
  // Saffron kicker dot + kicker text
  slide.addShape("rect", {
    x: 0.5, y: 0.45, w: 0.18, h: 0.18, fill: { color: C.accent }, line: { color: C.accent }
  });
  slide.addText(kicker.toUpperCase(), {
    x: 0.78, y: 0.36, w: 6, h: 0.36, fontFace: F_BODY, fontSize: 12,
    color: C.accentDk, bold: true, charSpacing: 4, valign: "middle", margin: 0,
  });
  slide.addText(title, {
    x: 0.5, y: 0.75, w: 9, h: 0.7, fontFace: F_HEAD, fontSize: 30,
    bold: true, color: C.primaryDk, margin: 0,
  });
}

function pageNum(slide, n, total) {
  slide.addText(`${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
    x: 9.0, y: 5.25, w: 0.85, h: 0.3, fontFace: F_BODY, fontSize: 9,
    color: C.muted, align: "right", margin: 0,
  });
  slide.addText("SAKHI", {
    x: 0.5, y: 5.25, w: 2, h: 0.3, fontFace: F_BODY, fontSize: 9,
    color: C.primary, bold: true, charSpacing: 3, margin: 0,
  });
}

function card(slide, x, y, w, h, opts = {}) {
  // White card with thin purple sidebar accent (0.10")
  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: opts.fill || C.card },
    line: { color: C.border, width: 0.5 },
    shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.06 },
  });
  if (opts.accent !== false) {
    slide.addShape("rect", {
      x, y, w: 0.08, h,
      fill: { color: opts.accentColor || C.primary },
      line: { color: opts.accentColor || C.primary },
    });
  }
}

function badge(slide, x, y, label, color = C.accent, textColor = C.white) {
  slide.addShape("ellipse", {
    x, y, w: 0.5, h: 0.5,
    fill: { color }, line: { color },
  });
  slide.addText(String(label), {
    x, y, w: 0.5, h: 0.5, fontFace: F_HEAD, fontSize: 18, bold: true,
    color: textColor, align: "center", valign: "middle", margin: 0,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN BUILD
// ─────────────────────────────────────────────────────────────────────────────
async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = "Sakhi — Credit for Bharat";
  pres.author = "Team Sakhi";

  // Pre-rasterize icons in parallel
  const [
    icHeart, icBolt, icCheck, icPdf, icBrain, icCompass, icPhone,
    icBank, icMap, icLock, icChart, icFlag, icCogs, icPaper, icMic, icUsers,
  ] = await Promise.all([
    icon(Fa.FaHeart, "#" + C.accent),
    icon(Fa.FaBolt, "#" + C.accent),
    icon(Fa.FaCheckCircle, "#" + C.good),
    icon(Fa.FaFilePdf, "#" + C.primary),
    icon(Fa.FaBrain, "#" + C.primary),
    icon(Fa.FaCompass, "#" + C.primary),
    icon(Fa.FaMobileAlt, "#" + C.accent),
    icon(Fa.FaUniversity, "#" + C.accent),
    icon(Fa.FaMapMarkedAlt, "#" + C.primary),
    icon(Fa.FaLock, "#" + C.primary),
    icon(Fa.FaChartLine, "#" + C.accent),
    icon(Fa.FaFlag, "#" + C.accent),
    icon(Fa.FaCogs, "#" + C.primary),
    icon(Hi.HiOutlineDocumentText, "#" + C.primary),
    icon(Fa.FaMicrophoneAlt, "#" + C.primary),
    icon(Fa.FaUsers, "#" + C.primary),
  ]);

  // ────────────────────────────────────────────────────────────────────────
  // Slide 1 — Title
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    darkBg(s);

    // Decorative saffron arc (large circle bottom-right, partially off-slide)
    s.addShape("ellipse", {
      x: 7.2, y: 3.4, w: 5.2, h: 5.2,
      fill: { color: C.accent, transparency: 80 }, line: { color: C.accent, transparency: 80 },
    });
    s.addShape("ellipse", {
      x: 8.0, y: 4.0, w: 3.6, h: 3.6,
      fill: { color: C.accent, transparency: 60 }, line: { color: C.accent, transparency: 60 },
    });

    // Saffron tagline mark
    s.addShape("rect", {
      x: 0.5, y: 0.6, w: 0.4, h: 0.06,
      fill: { color: C.accent }, line: { color: C.accent },
    });
    s.addText("UCO BANK · BHARATSCORE V2 PITCH · 2026", {
      x: 1.0, y: 0.46, w: 8, h: 0.3, fontFace: F_BODY, fontSize: 11, bold: true,
      color: C.accent, charSpacing: 6, valign: "middle", margin: 0,
    });

    // SAKHI big mark
    s.addText("Sakhi", {
      x: 0.5, y: 1.4, w: 8, h: 1.6, fontFace: F_HEAD, fontSize: 110, bold: true,
      color: C.white, margin: 0,
    });
    s.addText("सखी", {
      x: 0.5, y: 2.95, w: 8, h: 0.7, fontFace: F_HEAD, fontSize: 32,
      color: C.accent, italic: true, margin: 0,
    });

    s.addText("Credit for every Bharatiya.", {
      x: 0.5, y: 3.85, w: 8, h: 0.45, fontFace: F_BODY, fontSize: 22,
      color: C.white, margin: 0,
    });
    s.addText(
      "An AI-powered alternative credit scoring platform for the 250M+ Indians invisible to CIBIL.",
      { x: 0.5, y: 4.35, w: 8.5, h: 0.6, fontFace: F_BODY, fontSize: 14,
        color: "C8B5DC", margin: 0 }
    );

    s.addText("github.com/DrustO9/Sakhi_finance", {
      x: 0.5, y: 5.18, w: 6, h: 0.3, fontFace: F_BODY, fontSize: 10,
      color: C.accent, charSpacing: 2, margin: 0,
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 2 — The Problem (big stats)
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "The problem", "1.3 billion Indians. Half are credit-invisible.");

    // 3 large stat blocks
    const stats = [
      { num: "250M+", label: "Indians with no formal credit history",
        sub: "No CIBIL, no bureau record — invisible to traditional banks." },
      { num: "27%",  label: "of Indian adults hold a formal loan",
        sub: "Globally the median is 47%. The gap is mostly the informal sector." },
      { num: "₹37 L Cr", label: "untapped lending opportunity",
        sub: "RBI estimate of credit demand from MSMEs and underbanked households." },
    ];

    stats.forEach((st, i) => {
      const x = 0.5 + i * 3.07;
      card(s, x, 1.7, 2.9, 2.9, { accentColor: i === 1 ? C.accent : C.primary });
      s.addText(st.num, {
        x: x + 0.25, y: 1.85, w: 2.55, h: 1.0,
        fontFace: F_HEAD, fontSize: 48, bold: true, color: C.primaryDk, margin: 0,
      });
      s.addText(st.label, {
        x: x + 0.25, y: 2.95, w: 2.55, h: 0.6,
        fontFace: F_BODY, fontSize: 12, bold: true, color: C.text, margin: 0,
      });
      s.addText(st.sub, {
        x: x + 0.25, y: 3.55, w: 2.55, h: 1.0,
        fontFace: F_BODY, fontSize: 10, color: C.muted, margin: 0,
      });
    });

    s.addText(
      "These borrowers are not high-risk — they are unmeasured. Banks use the wrong yardstick on the wrong people.",
      { x: 0.5, y: 4.78, w: 9, h: 0.4, fontFace: F_BODY, fontSize: 13, italic: true,
        color: C.primaryDk, margin: 0 }
    );

    pageNum(s, 2, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 3 — Why traditional credit fails them
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "Root cause", "The data the bank wants doesn't exist for them.");

    // Two-column comparison
    // Left: What CIBIL needs
    card(s, 0.5, 1.7, 4.4, 3.2, { accentColor: C.warn, fill: "FFF5F2" });
    s.addText("What CIBIL requires", {
      x: 0.7, y: 1.85, w: 4.1, h: 0.4,
      fontFace: F_HEAD, fontSize: 17, bold: true, color: C.warn, margin: 0,
    });
    const cibilNeeds = [
      "Past loan repayment history",
      "Credit-card utilization data",
      "Salaried-employee income proofs",
      "Documented address & bureau record",
      "Three-year track record minimum",
    ];
    s.addText(cibilNeeds.map((t, i) => ({
      text: t, options: { bullet: { code: "25CF" }, breakLine: i < cibilNeeds.length - 1 },
    })), {
      x: 0.8, y: 2.35, w: 3.9, h: 2.5, fontFace: F_BODY, fontSize: 12,
      color: C.text, paraSpaceAfter: 4, margin: 0,
    });

    // Center connector
    s.addShape("rect", { x: 4.95, y: 3.0, w: 0.1, h: 0.6, fill: { color: C.muted }, line: { color: C.muted } });
    s.addText("VS", {
      x: 4.7, y: 2.5, w: 0.6, h: 0.4, fontFace: F_HEAD, fontSize: 16, bold: true,
      color: C.muted, align: "center", margin: 0,
    });

    // Right: What rural / informal India actually has
    card(s, 5.1, 1.7, 4.4, 3.2, { accentColor: C.good, fill: "F2FAF7" });
    s.addText("What the user actually has", {
      x: 5.3, y: 1.85, w: 4.1, h: 0.4,
      fontFace: F_HEAD, fontSize: 17, bold: true, color: C.good, margin: 0,
    });
    const realLife = [
      "6 months of UPI transactions",
      "Daily cash flow from a kirana / farm",
      "A network of community guarantors",
      "Behavioral patterns (savings, time-discount)",
      "A smartphone and a Hindi voice",
    ];
    s.addText(realLife.map((t, i) => ({
      text: t, options: { bullet: { code: "25CF" }, breakLine: i < realLife.length - 1 },
    })), {
      x: 5.4, y: 2.35, w: 3.9, h: 2.5, fontFace: F_BODY, fontSize: 12,
      color: C.text, paraSpaceAfter: 4, margin: 0,
    });

    s.addText("Sakhi reads the right signals — the ones already there.", {
      x: 0.5, y: 5.05, w: 9, h: 0.3, fontFace: F_BODY, fontSize: 12, italic: true,
      color: C.primaryDk, align: "center", margin: 0,
    });

    pageNum(s, 3, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 4 — Solution: three pillars
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "Our solution", "Sakhi scores the unscored — in three steps.");

    const pillars = [
      { ic: icPdf,   title: "UPI Cash-Flow Parser",
        body: "Read 6 months of UPI activity. Extract 8 financial-behavior features in seconds.",
        tag: "Tier 1 · Shipped" },
      { ic: icBrain, title: "Vernacular Psychometric Test",
        body: "10 audio-narrated questions in Hindi & English. Grounded in Klinger et al. (2013).",
        tag: "Tier 1 · Shipped" },
      { ic: icCompass, title: "Counterfactual Explanations",
        body: "Every rejection comes with 3 actionable improvement paths — generated by DiCE.",
        tag: "Tier 1 · Shipped" },
    ];

    pillars.forEach((p, i) => {
      const x = 0.5 + i * 3.07;
      card(s, x, 1.7, 2.9, 3.3, { accentColor: C.primary });
      s.addImage({ data: p.ic, x: x + 0.3, y: 1.95, w: 0.55, h: 0.55 });
      s.addText(p.title, {
        x: x + 0.3, y: 2.6, w: 2.5, h: 0.55,
        fontFace: F_HEAD, fontSize: 16, bold: true, color: C.primaryDk, margin: 0,
      });
      s.addText(p.body, {
        x: x + 0.3, y: 3.2, w: 2.45, h: 1.4,
        fontFace: F_BODY, fontSize: 11.5, color: C.text, margin: 0,
      });
      // Tag pill
      s.addShape("roundRect", {
        x: x + 0.3, y: 4.55, w: 1.7, h: 0.32, rectRadius: 0.16,
        fill: { color: C.primaryLt }, line: { color: C.primaryLt },
      });
      s.addText(p.tag, {
        x: x + 0.3, y: 4.55, w: 1.7, h: 0.32, fontFace: F_BODY, fontSize: 9, bold: true,
        color: C.primary, align: "center", valign: "middle", charSpacing: 1, margin: 0,
      });
    });

    pageNum(s, 4, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 5 — UPI Cash-Flow Parser
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "Pillar 01", "UPI Cash-Flow Parser — what 6 months of UPI tells us.");

    // Left column: pipeline visualization
    card(s, 0.5, 1.65, 4.3, 3.45);
    s.addText("From PDF to score in seconds", {
      x: 0.7, y: 1.78, w: 4.0, h: 0.4,
      fontFace: F_HEAD, fontSize: 14, bold: true, color: C.primaryDk, margin: 0,
    });

    const steps = [
      ["1", "PDF upload",        "PhonePe / GPay / bank statement"],
      ["2", "Extract transactions", "pdfplumber → 200–500 rows"],
      ["3", "Aggregate features",   "8 behavioral signals per applicant"],
      ["4", "Score with LightGBM",  "Probability of default in <2s"],
    ];
    steps.forEach(([n, t, d], i) => {
      const y = 2.3 + i * 0.65;
      badge(s, 0.7, y, n, C.accent, C.white);
      s.addText(t, {
        x: 1.35, y: y, w: 3.3, h: 0.28, fontFace: F_BODY, fontSize: 12, bold: true,
        color: C.text, valign: "middle", margin: 0,
      });
      s.addText(d, {
        x: 1.35, y: y + 0.27, w: 3.3, h: 0.25, fontFace: F_BODY, fontSize: 10,
        color: C.muted, valign: "middle", margin: 0,
      });
    });

    // Right column: 8 features grid
    card(s, 5.0, 1.65, 4.5, 3.45);
    s.addText("8 features extracted", {
      x: 5.2, y: 1.78, w: 4.2, h: 0.4,
      fontFace: F_HEAD, fontSize: 14, bold: true, color: C.primaryDk, margin: 0,
    });
    s.addText("Predictive power per BharatScore v2 spec", {
      x: 5.2, y: 2.12, w: 4.2, h: 0.25, fontFace: F_BODY, fontSize: 10,
      italic: true, color: C.muted, margin: 0,
    });

    const feats = [
      ["Income regularity",       "Very high"],
      ["Savings ratio",           "Very high"],
      ["Avg monthly inflow",      "High"],
      ["Discretionary spending",  "High"],
      ["EMI count",               "High"],
      ["Merchant diversity",      "Medium"],
      ["P2P transfer share",      "Medium"],
      ["ATM withdrawal share",    "Negative signal"],
    ];
    feats.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 5.2 + col * 2.15;
      const y = 2.45 + row * 0.61;
      s.addShape("rect", {
        x, y, w: 2.05, h: 0.52, fill: { color: C.primaryLt }, line: { color: C.primaryLt },
      });
      s.addText(f[0], {
        x: x + 0.1, y: y + 0.04, w: 1.95, h: 0.25,
        fontFace: F_BODY, fontSize: 10.5, bold: true, color: C.primaryDk, margin: 0,
      });
      s.addText(f[1], {
        x: x + 0.1, y: y + 0.27, w: 1.95, h: 0.22,
        fontFace: F_BODY, fontSize: 9, color: C.muted, italic: true, margin: 0,
      });
    });

    pageNum(s, 5, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 6 — Vernacular Psychometric Test
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "Pillar 02", "Behavioral signal where data history doesn't exist.");

    // Left: explanatory column
    card(s, 0.5, 1.65, 4.5, 3.45);
    s.addText("Grounded in research, not guesswork", {
      x: 0.7, y: 1.78, w: 4.2, h: 0.4,
      fontFace: F_HEAD, fontSize: 14, bold: true, color: C.primaryDk, margin: 0,
    });

    s.addText([
      { text: "Klinger, Khwaja & LaMonte (2013) — IDB Working Paper IDB-WP-587 — show a 25-min psychometric battery hits AUC ", options: { fontSize: 11, color: C.text } },
      { text: "0.69 ", options: { bold: true, color: C.primary, fontSize: 11 } },
      { text: "for borrowers with no bureau record — comparable to a traditional credit score.", options: { fontSize: 11, color: C.text } },
    ], { x: 0.7, y: 2.2, w: 4.2, h: 1.1, margin: 0 });

    s.addText("5 constructs measured", {
      x: 0.7, y: 3.35, w: 4.2, h: 0.3, fontFace: F_BODY, fontSize: 11, bold: true,
      color: C.primaryDk, charSpacing: 1, margin: 0,
    });
    const constructs = [
      "Time-discount (Frederick et al. 2002)",
      "Risk tolerance (Kahneman-Tversky 1979)",
      "Cooperation (Berg-Dickhaut-McCabe 1995)",
      "Numeracy (Lipkus-Samsa-Rimer 2001)",
      "Stress response (CD-RISC, Connor 2003)",
    ];
    s.addText(constructs.map((t, i) => ({
      text: t, options: { bullet: { code: "25AA" }, breakLine: i < constructs.length - 1 },
    })), {
      x: 0.85, y: 3.65, w: 4.0, h: 1.4, fontFace: F_BODY, fontSize: 10.5,
      color: C.text, paraSpaceAfter: 2, margin: 0,
    });

    // Right: sample question card (looks like a phone)
    card(s, 5.2, 1.65, 4.3, 3.45, { accentColor: C.accent });
    s.addText("SAMPLE · हिं", {
      x: 5.4, y: 1.78, w: 4.0, h: 0.3, fontFace: F_BODY, fontSize: 9, bold: true,
      color: C.accentDk, charSpacing: 4, margin: 0,
    });
    s.addText("Time-Discount  ·  td_1", {
      x: 5.4, y: 2.05, w: 4.0, h: 0.3, fontFace: F_BODY, fontSize: 10, bold: true,
      color: C.muted, charSpacing: 1, margin: 0,
    });
    s.addText(
      "\"आपको अचानक 10,000 रुपये मिलते हैं — आप अभी टीवी खरीदेंगे, या अगली फसल के लिए बचाएंगे?\"",
      { x: 5.4, y: 2.4, w: 4.0, h: 0.85, fontFace: F_HEAD, fontSize: 13.5,
        italic: true, color: C.primaryDk, margin: 0 }
    );

    // Two option pills
    s.addShape("rect", {
      x: 5.4, y: 3.4, w: 4.0, h: 0.45,
      fill: { color: C.bg }, line: { color: C.border, width: 1 },
    });
    s.addText("A.  टीवी पर अभी खर्च करें", {
      x: 5.55, y: 3.4, w: 3.85, h: 0.45, fontFace: F_BODY, fontSize: 11,
      color: C.text, valign: "middle", margin: 0,
    });
    s.addShape("rect", {
      x: 5.4, y: 3.95, w: 4.0, h: 0.45,
      fill: { color: C.primaryLt }, line: { color: C.primary, width: 1 },
    });
    s.addText("B.  अगले सीज़न के लिए बचाएं", {
      x: 5.55, y: 3.95, w: 3.85, h: 0.45, fontFace: F_BODY, fontSize: 11,
      color: C.primaryDk, bold: true, valign: "middle", margin: 0,
    });

    s.addImage({ data: icMic, x: 5.4, y: 4.55, w: 0.3, h: 0.3 });
    s.addText("Audio narration in EN + HI · browser TTS fallback", {
      x: 5.78, y: 4.55, w: 3.6, h: 0.3, fontFace: F_BODY, fontSize: 10,
      color: C.muted, italic: true, valign: "middle", margin: 0,
    });

    pageNum(s, 6, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 7 — Counterfactual Explanations
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "Pillar 03", "Rejection isn't a dead end — it's a path.");

    // Left: the principle
    card(s, 0.5, 1.65, 4.5, 3.45);
    s.addText("From \"no\" to \"do this\"", {
      x: 0.7, y: 1.78, w: 4.2, h: 0.45,
      fontFace: F_HEAD, fontSize: 16, bold: true, color: C.primaryDk, margin: 0,
    });
    s.addText(
      "Every rejected applicant gets 3 concrete improvement paths — computed by DiCE on the trained LightGBM model.",
      { x: 0.7, y: 2.3, w: 4.2, h: 0.85, fontFace: F_BODY, fontSize: 12,
        color: C.text, margin: 0 }
    );
    s.addText("Constraints applied", {
      x: 0.7, y: 3.3, w: 4.2, h: 0.3, fontFace: F_BODY, fontSize: 11, bold: true,
      color: C.primaryDk, charSpacing: 1, margin: 0,
    });
    const constraints = [
      "Actionable features only (no \"be older\" suggestions)",
      "Realistic deltas (no 300% income jump)",
      "3 diverse paths so users can pick what's feasible",
    ];
    s.addText(constraints.map((t, i) => ({
      text: t, options: { bullet: { code: "25AA" }, breakLine: i < constraints.length - 1 },
    })), {
      x: 0.85, y: 3.6, w: 4.0, h: 1.4, fontFace: F_BODY, fontSize: 11,
      color: C.text, paraSpaceAfter: 2, margin: 0,
    });

    // Right: sample output card
    card(s, 5.2, 1.65, 4.3, 3.45, { accentColor: C.accent });
    s.addText("Sample output  ·  Tier D applicant", {
      x: 5.4, y: 1.78, w: 4.0, h: 0.3, fontFace: F_BODY, fontSize: 10, bold: true,
      color: C.muted, charSpacing: 1, margin: 0,
    });
    s.addText("To reach Tier B, you can:", {
      x: 5.4, y: 2.1, w: 4.0, h: 0.4, fontFace: F_HEAD, fontSize: 14, bold: true,
      color: C.primaryDk, margin: 0,
    });

    const cfs = [
      ["Path 1", "Lift savings ratio  −2.0 → +0.6", "Cut discretionary spend by 40%"],
      ["Path 2", "Improve patience score  0.0 → 0.9", "Behavioral coaching · 60 days"],
      ["Path 3", "Reduce existing EMIs  6 → 2", "Consolidate active loans"],
    ];
    cfs.forEach((cf, i) => {
      const y = 2.55 + i * 0.78;
      s.addShape("rect", {
        x: 5.4, y, w: 4.0, h: 0.7,
        fill: { color: i === 0 ? "FFF8F0" : C.bg }, line: { color: C.border, width: 0.5 },
      });
      s.addText(cf[0], {
        x: 5.5, y: y + 0.05, w: 0.8, h: 0.3, fontFace: F_BODY, fontSize: 9, bold: true,
        color: C.accentDk, charSpacing: 2, margin: 0,
      });
      s.addText(cf[1], {
        x: 5.5, y: y + 0.27, w: 3.85, h: 0.25, fontFace: F_BODY, fontSize: 11, bold: true,
        color: C.primaryDk, margin: 0,
      });
      s.addText(cf[2], {
        x: 5.5, y: y + 0.48, w: 3.85, h: 0.22, fontFace: F_BODY, fontSize: 10,
        color: C.muted, italic: true, margin: 0,
      });
    });

    pageNum(s, 7, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 8 — Live MVP (the journey)
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "MVP shipped", "From signup to score in 60 seconds.");

    const stages = [
      { n: "01", title: "Welcome",        sub: "Mobile-first, EN/हिं toggle"    },
      { n: "02", title: "UPI Upload",     sub: "PDF → 8 features in <2s"        },
      { n: "03", title: "Behavioral Test", sub: "10 questions, audio narration"  },
      { n: "04", title: "Score + Path",   sub: "Tier · SHAP · counterfactuals"  },
    ];
    stages.forEach((st, i) => {
      const x = 0.5 + i * 2.32;
      // phone-frame card
      s.addShape("rect", {
        x, y: 1.7, w: 2.1, h: 3.3,
        fill: { color: C.primaryDk }, line: { color: C.primaryDk },
      });
      s.addShape("rect", {
        x: x + 0.08, y: 1.84, w: 1.94, h: 3.02,
        fill: { color: C.white }, line: { color: C.white },
      });
      // tiny topbar
      s.addShape("rect", {
        x: x + 0.08, y: 1.84, w: 1.94, h: 0.48,
        fill: { color: C.primary }, line: { color: C.primary },
      });
      s.addText("Sakhi", {
        x: x + 0.18, y: 1.85, w: 1.74, h: 0.46, fontFace: F_HEAD, fontSize: 12, bold: true,
        color: C.white, valign: "middle", margin: 0,
      });
      // step number
      badge(s, x + 0.8, 2.55, st.n, C.accent, C.white);
      // title
      s.addText(st.title, {
        x: x + 0.1, y: 3.2, w: 1.9, h: 0.4, fontFace: F_HEAD, fontSize: 13, bold: true,
        color: C.primaryDk, align: "center", margin: 0,
      });
      s.addText(st.sub, {
        x: x + 0.1, y: 3.6, w: 1.9, h: 0.6, fontFace: F_BODY, fontSize: 10,
        color: C.muted, align: "center", margin: 0,
      });
      // dot row
      [0, 1, 2].forEach(d => {
        s.addShape("ellipse", {
          x: x + 0.7 + d * 0.22, y: 4.4, w: 0.12, h: 0.12,
          fill: { color: d === i ? C.accent : C.border }, line: { color: d === i ? C.accent : C.border },
        });
      });
    });

    s.addText("Live local demo · localhost:5173 · runs offline · sample PDFs in repo", {
      x: 0.5, y: 5.18, w: 9, h: 0.3, fontFace: F_BODY, fontSize: 11, italic: true,
      color: C.primaryDk, align: "center", margin: 0,
    });

    pageNum(s, 8, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 9 — Architecture
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "Architecture", "Boring stack. Sharp output.");

    // Frontend block
    s.addShape("rect", {
      x: 0.5, y: 1.7, w: 9, h: 0.85,
      fill: { color: C.primary }, line: { color: C.primary },
    });
    s.addImage({ data: icPhone, x: 0.7, y: 1.92, w: 0.4, h: 0.4 });
    s.addText("React 18 + Vite — mobile-first frontend (460 px frame · EN/HI i18n)", {
      x: 1.2, y: 1.7, w: 8.2, h: 0.85, fontFace: F_BODY, fontSize: 14, bold: true,
      color: C.white, valign: "middle", margin: 0,
    });

    // Arrow down
    s.addText("↓ /api/parse-upi · /api/score · /api/admin/*", {
      x: 0.5, y: 2.62, w: 9, h: 0.32, fontFace: F_BODY, fontSize: 10, italic: true,
      color: C.muted, align: "center", margin: 0,
    });

    // Backend container
    s.addShape("rect", {
      x: 0.5, y: 3.0, w: 9, h: 1.65,
      fill: { color: C.card }, line: { color: C.primary, width: 1.5 },
    });
    s.addText("FastAPI backend", {
      x: 0.7, y: 3.05, w: 4, h: 0.32, fontFace: F_HEAD, fontSize: 11, bold: true,
      color: C.primaryDk, charSpacing: 1, margin: 0,
    });

    // 4 service tiles inside backend
    const services = [
      { ic: icPaper, t: "pdfplumber",   d: "PDF → tx rows" },
      { ic: icCogs,  t: "Feature agg",   d: "8 UPI signals" },
      { ic: icBrain, t: "LightGBM PD",   d: "AUC 0.674"     },
      { ic: icCompass, t: "SHAP + DiCE", d: "explain · CFs" },
    ];
    services.forEach((srv, i) => {
      const x = 0.7 + i * 2.18;
      s.addShape("rect", {
        x, y: 3.45, w: 2.05, h: 1.05,
        fill: { color: C.primaryLt }, line: { color: C.primaryLt },
      });
      s.addImage({ data: srv.ic, x: x + 0.1, y: 3.55, w: 0.3, h: 0.3 });
      s.addText(srv.t, {
        x: x + 0.1, y: 3.88, w: 1.85, h: 0.3, fontFace: F_BODY, fontSize: 11.5, bold: true,
        color: C.primaryDk, margin: 0,
      });
      s.addText(srv.d, {
        x: x + 0.1, y: 4.16, w: 1.85, h: 0.3, fontFace: F_BODY, fontSize: 9.5,
        color: C.muted, margin: 0,
      });
    });

    // DB row
    s.addShape("rect", {
      x: 0.5, y: 4.78, w: 9, h: 0.5,
      fill: { color: C.primaryDk }, line: { color: C.primaryDk },
    });
    s.addText("SQLite · applications + decisions log + SHAP per row · upgradeable to Postgres", {
      x: 0.5, y: 4.78, w: 9, h: 0.5, fontFace: F_BODY, fontSize: 11,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });

    pageNum(s, 9, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 10 — Model performance
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "Model performance", "0.674 AUC — in line with peer-reviewed precedent.");

    // Big stat block + comparison
    card(s, 0.5, 1.65, 4.0, 3.4);
    s.addText("0.674", {
      x: 0.6, y: 1.85, w: 3.8, h: 1.3, fontFace: F_HEAD, fontSize: 80, bold: true,
      color: C.primary, margin: 0,
    });
    s.addText("Test AUC · 6,000 synthetic applicants", {
      x: 0.7, y: 3.15, w: 3.7, h: 0.3, fontFace: F_BODY, fontSize: 11, bold: true,
      color: C.primaryDk, margin: 0,
    });
    s.addText("Train AUC 0.855 · default rate 31.8% · stratified split", {
      x: 0.7, y: 3.45, w: 3.7, h: 0.3, fontFace: F_BODY, fontSize: 10,
      color: C.muted, margin: 0,
    });

    // Comparison row
    s.addShape("rect", {
      x: 0.7, y: 3.95, w: 3.6, h: 0.95,
      fill: { color: C.primaryLt }, line: { color: C.primaryLt },
    });
    s.addText("Klinger et al. (2013) reported AUC = 0.69 on Peruvian micro-entrepreneurs with no bureau record.", {
      x: 0.85, y: 3.95, w: 3.4, h: 0.95, fontFace: F_BODY, fontSize: 10, italic: true,
      color: C.primaryDk, valign: "middle", margin: 0,
    });

    // Right: feature importance chart
    s.addChart(pres.charts.BAR, [{
      name: "Importance (gain)",
      labels: ["Savings ratio", "Income regularity", "Discretionary spend", "Patience", "EMI count", "Cooperation", "ATM share", "Avg inflow"],
      values: [1647, 1616, 1337, 1285, 1070, 943, 636, 600],
    }], {
      x: 4.7, y: 1.65, w: 4.8, h: 3.4,
      barDir: "bar",
      chartColors: [C.primary],
      chartArea: { fill: { color: C.card }, roundedCorners: true },
      catAxisLabelColor: C.text,
      catAxisLabelFontSize: 10,
      valAxisLabelColor: C.muted,
      valAxisLabelFontSize: 9,
      valGridLine: { color: C.border, size: 0.5 },
      catGridLine: { style: "none" },
      showLegend: false,
      showTitle: true,
      title: "Feature importance (LightGBM gain)",
      titleColor: C.primaryDk,
      titleFontSize: 11,
      titleFontFace: F_HEAD,
    });

    pageNum(s, 10, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 11 — Why this matters for UCO Bank
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "Why UCO Bank", "PSU banks own this segment. They just can't see it.");

    const reasons = [
      { ic: icBank, t: "Branch network advantage",
        d: "UCO has 3,000+ rural & semi-urban branches. Sakhi turns each into a digital onboarding node — no new infra." },
      { ic: icMap,  t: "Aligns with PMJDY / financial inclusion mandate",
        d: "PSU banks are explicitly tasked to serve the underbanked. Sakhi makes the unit economics work." },
      { ic: icLock, t: "DPDP-ready by design",
        d: "Per-application consent tokens, scoped data retention, audit log on every decision." },
      { ic: icChart, t: "Defensible against private players",
        d: "Build an in-house alt-credit moat before fintechs cherry-pick the same segment with fewer protections." },
    ];

    reasons.forEach((r, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 4.6;
      const y = 1.7 + row * 1.75;
      card(s, x, y, 4.4, 1.55, { accentColor: C.accent });
      s.addImage({ data: r.ic, x: x + 0.25, y: y + 0.2, w: 0.5, h: 0.5 });
      s.addText(r.t, {
        x: x + 0.95, y: y + 0.15, w: 3.35, h: 0.45,
        fontFace: F_HEAD, fontSize: 13.5, bold: true, color: C.primaryDk, margin: 0,
      });
      s.addText(r.d, {
        x: x + 0.95, y: y + 0.55, w: 3.35, h: 0.95, fontFace: F_BODY, fontSize: 10.5,
        color: C.text, margin: 0,
      });
    });

    pageNum(s, 11, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 12 — Roadmap
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "Roadmap", "9 features, three tiers, 12 weeks to v1.");

    const tiers = [
      {
        title: "Tier 1 · Shipped",
        sub: "MVP · 2 weeks",
        color: C.good,
        items: ["UPI Cash-Flow Parser", "Counterfactual Explanations", "Vernacular Psychometric Test"],
      },
      {
        title: "Tier 2 · Next 6 weeks",
        sub: "Differentiation",
        color: C.accent,
        items: ["Voice-Based Risk Assessment", "Social Graph Scoring", "Repayment Nudge Engine"],
      },
      {
        title: "Tier 3 · 12-week roadmap",
        sub: "Scale & moat",
        color: C.primary,
        items: ["MSME Scoring Track", "Group Lending (SHG Mode)", "Default Insurance Pool"],
      },
    ];

    tiers.forEach((t, i) => {
      const x = 0.5 + i * 3.07;
      card(s, x, 1.7, 2.9, 3.3, { accentColor: t.color });
      s.addText(t.title, {
        x: x + 0.25, y: 1.85, w: 2.55, h: 0.4,
        fontFace: F_HEAD, fontSize: 14, bold: true, color: t.color, margin: 0,
      });
      s.addText(t.sub.toUpperCase(), {
        x: x + 0.25, y: 2.25, w: 2.55, h: 0.3,
        fontFace: F_BODY, fontSize: 9, color: C.muted, charSpacing: 3, margin: 0,
      });
      // line separator
      s.addShape("rect", {
        x: x + 0.25, y: 2.6, w: 0.5, h: 0.04,
        fill: { color: t.color }, line: { color: t.color },
      });
      // items
      t.items.forEach((it, j) => {
        const y = 2.85 + j * 0.55;
        badge(s, x + 0.25, y, j + 1, t.color, C.white);
        s.addText(it, {
          x: x + 0.85, y: y, w: 1.95, h: 0.5, fontFace: F_BODY, fontSize: 11.5, bold: true,
          color: C.text, valign: "middle", margin: 0,
        });
      });
    });

    pageNum(s, 12, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 13 — The Ask
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    contentBg(s);
    pageHeader(s, "The ask", "A pilot we can both learn from.");

    const asks = [
      { ic: icUsers, t: "500-borrower pilot",
        d: "1 district · 3 months · UCO branch staff onboard borrowers, Sakhi scores them. Real-loan performance feeds model recalibration." },
      { ic: icPaper, t: "Anonymized loan-performance data",
        d: "Past 24 months of disbursements + 90-day-default flags from one PSU portfolio. Drives our supervised retraining." },
      { ic: icCogs,  t: "Sandbox API access",
        d: "Read-only access to UCO's KYC/Aadhaar verification rails for the pilot cohort, under a signed DPDP-compliant DPA." },
    ];

    asks.forEach((a, i) => {
      const y = 1.7 + i * 1.05;
      card(s, 0.5, y, 9, 0.95, { accentColor: C.accent });
      s.addImage({ data: a.ic, x: 0.7, y: y + 0.2, w: 0.55, h: 0.55 });
      s.addText(a.t, {
        x: 1.45, y: y + 0.1, w: 3.0, h: 0.4,
        fontFace: F_HEAD, fontSize: 14, bold: true, color: C.primaryDk, margin: 0,
      });
      s.addText(a.d, {
        x: 1.45, y: y + 0.45, w: 7.85, h: 0.55, fontFace: F_BODY, fontSize: 10.5,
        color: C.text, margin: 0,
      });
    });

    s.addShape("rect", {
      x: 0.5, y: 4.95, w: 9, h: 0.5,
      fill: { color: C.primaryDk }, line: { color: C.primaryDk },
    });
    s.addText("In return: open-source code, full SHAP audit trail, joint co-authorship on the pilot study.", {
      x: 0.5, y: 4.95, w: 9, h: 0.5, fontFace: F_BODY, fontSize: 12, bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });

    pageNum(s, 13, 14);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Slide 14 — Thank you
  // ────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    darkBg(s);

    // Decorative arc
    s.addShape("ellipse", {
      x: -2.5, y: -2, w: 5, h: 5,
      fill: { color: C.accent, transparency: 80 }, line: { color: C.accent, transparency: 80 },
    });

    s.addShape("rect", {
      x: 0.5, y: 0.6, w: 0.4, h: 0.06,
      fill: { color: C.accent }, line: { color: C.accent },
    });
    s.addText("THANK YOU", {
      x: 1.0, y: 0.46, w: 8, h: 0.3, fontFace: F_BODY, fontSize: 11, bold: true,
      color: C.accent, charSpacing: 6, valign: "middle", margin: 0,
    });

    s.addText("Questions?", {
      x: 0.5, y: 1.6, w: 9, h: 1.2, fontFace: F_HEAD, fontSize: 76, bold: true,
      color: C.white, margin: 0,
    });

    s.addText("सखी का सपना — हर भारतीय के लिए ऋण।", {
      x: 0.5, y: 3.0, w: 9, h: 0.6, fontFace: F_HEAD, fontSize: 22, italic: true,
      color: C.accent, margin: 0,
    });

    // Repo + contact card
    s.addShape("rect", {
      x: 0.5, y: 4.0, w: 9, h: 1.05,
      fill: { color: "FFFFFF", transparency: 90 }, line: { color: C.accent, width: 1 },
    });
    s.addText("REPO", {
      x: 0.7, y: 4.1, w: 1.5, h: 0.3, fontFace: F_BODY, fontSize: 9, bold: true,
      color: C.accent, charSpacing: 4, margin: 0,
    });
    s.addText("github.com/DrustO9/Sakhi_finance", {
      x: 0.7, y: 4.35, w: 6, h: 0.4, fontFace: F_BODY, fontSize: 16, bold: true,
      color: C.white, margin: 0,
    });
    s.addText("Local demo: backend on :8000 · frontend on :5173 · runs offline · 4 sample UPI PDFs in repo", {
      x: 0.7, y: 4.72, w: 8.6, h: 0.3, fontFace: F_BODY, fontSize: 10, italic: true,
      color: "C8B5DC", margin: 0,
    });

    s.addText("Sakhi · UCO Bank BharatScore v2 · 2026", {
      x: 0.5, y: 5.25, w: 9, h: 0.3, fontFace: F_BODY, fontSize: 9,
      color: "8B6CB0", charSpacing: 3, align: "center", margin: 0,
    });
  }

  // ── Write file ────────────────────────────────────────────────────────────
  const outPath = path.join(__dirname, "Sakhi_Pitch_Deck.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log("Wrote:", outPath);
}

build().catch(err => { console.error(err); process.exit(1); });
