import {
  OVERVIEW_PDF_WEIGHT,
  OVERVIEW_REVIEWS_WEIGHT,
  QUESTIONS_PDF_WEIGHT,
  QUESTIONS_REVIEWS_WEIGHT,
} from "./config.js";
import { loadResearchPdfText } from "./research-pdf.js";
import { getHardcodedDiscoveryQuestions } from "./discovery-qa.js";

const GEMINI_MODEL = "gemini-2.5-flash";

export const DISCOVERY_QUESTIONS = [
  "Why do users struggle to discover new music?",
  "What are the most common frustrations with recommendations?",
  "What listening behaviors are users trying to achieve?",
  "What causes users to listen to the same content repeatedly?",
  "Which user segments experience different discovery challenges?",
  "What unmet needs emerge consistently across reviews?",
];

const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    overview: { type: "STRING" },
    discoveryQuestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          answer: { type: "STRING" },
          highlights: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["question", "answer", "highlights"],
      },
    },
    sentimentPct: {
      type: "OBJECT",
      properties: {
        positive: { type: "NUMBER" },
        negative: { type: "NUMBER" },
        neutral: { type: "NUMBER" },
      },
      required: ["positive", "negative", "neutral"],
    },
  },
  required: ["overview", "discoveryQuestions", "sentimentPct"],
};

const QUESTION_PROFILES = [
  {
    keywords: ["discover", "find", "search", "explore", "new artist", "recommend", "suggestion"],
    answer: (n, snippets) =>
      `${n} reviews point to discovery friction — weak search, hard-to-find new artists, and recommendations that recycle familiar tracks instead of opening new paths.`,
    defaultHighlights: ["Search misses typos and mood queries", "New artists buried under trending charts", "Daily mixes feel like echo chambers"],
  },
  {
    keywords: ["recommend", "suggestion", "autoplay", "repeat", "same song", "daily mix", "playlist"],
    answer: (n, snippets) =>
      `${n} reviews complain that recommendations and autoplay loop the same songs, so one bad signal can lock users into repetitive listening.`,
    defaultHighlights: ["Same 15–20 tracks on repeat", "Autoplay ignores recent skips", "No easy way to reset taste profile"],
  },
  {
    keywords: ["listen", "commute", "workout", "mood", "offline", "download", "background", "sleep"],
    answer: (n, snippets) =>
      `${n} reviews describe intent-driven listening — commutes, workouts, regional catalogs, and uninterrupted sessions — but discovery tools rarely match those contexts.`,
    defaultHighlights: ["Mood-based listening is poorly supported", "Offline and background use breaks discovery flows", "Regional catalogs valued when surfaced well"],
  },
  {
    keywords: ["repeat", "same", "again", "loop", "again and again", "stuck", "boring"],
    answer: (n, snippets) =>
      `${n} reviews tie repetition to algorithm bias toward past plays and trending lists, with little serendipity or novelty control.`,
    defaultHighlights: ["Heavy weight on listening history", "Trending defaults crowd out fresh picks", "Weak controls to break out of loops"],
  },
  {
    keywords: ["hindi", "tamil", "telugu", "punjabi", "regional", "premium", "subscription", "free", "language"],
    answer: (n, snippets) =>
      `${n} reviews show segment-specific walls — regional-language listeners, premium subscribers, and free-tier users each hit different discovery limits.`,
    defaultHighlights: ["Language silos limit cross-genre discovery", "Paying users expect smarter recommendations", "Free-tier ads interrupt exploration"],
  },
  {
    keywords: ["need", "want", "wish", "missing", "feature", "improve", "fix", "update", "please add"],
    answer: (n, snippets) =>
      `${n} reviews surface recurring unmet needs: smarter search, fresher personalized releases, and clearer ways to undo bad recommendation signals.`,
    defaultHighlights: ["Typo-tolerant search requested often", "Users want personalized new-release surfacing", "Requests for a quick taste reset control"],
  },
];

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
}

async function geminiGenerate(prompt, { json = false, maxTokens = 1200, schema = null } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const generationConfig = {
    maxOutputTokens: maxTokens,
    temperature: 0.35,
  };

  if (json) {
    generationConfig.responseMimeType = "application/json";
    if (schema) generationConfig.responseSchema = schema;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Gemini API request failed");
  }

  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text || "";
  if (!text.trim()) {
    const reason = candidate?.finishReason || "unknown";
    throw new Error(`Gemini returned an empty response (${reason})`);
  }
  return text.trim();
}

function parseAnalysisJson(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object in Gemini response");

  try {
    return JSON.parse(match[0]);
  } catch {
    const fixed = match[0]
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/\u201c|\u201d/g, '"');
    return JSON.parse(fixed);
  }
}

function pickSamples(reviews, limit = 350) {
  const sample = reviews.slice(0, limit);
  return {
    positive: sample.filter((r) => r.sentiment === "positive").slice(0, 40).map((r) => `[${r.source}] ${r.comment}`).join("\n"),
    negative: sample.filter((r) => r.sentiment === "negative").slice(0, 40).map((r) => `[${r.source}] ${r.comment}`).join("\n"),
    neutral: sample.filter((r) => r.sentiment === "neutral").slice(0, 20).map((r) => `[${r.source}] ${r.comment}`).join("\n"),
  };
}

function trimPdfForPrompt(text, maxChars = 12000) {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[Document truncated for analysis — remainder omitted]`;
}

function reviewMatches(review, keywords) {
  const hay = review.comment.toLowerCase();
  return keywords.some((kw) => hay.includes(kw));
}

function snippet(comment, maxLen = 110) {
  const text = comment.replace(/\s+/g, " ").trim();
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

function topThemes(reviews, limit = 5) {
  const freq = {};
  reviews.forEach((r) => {
    r.comment
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4 && !["gaana", "music", "songs", "please", "really"].includes(w))
      .forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([w]) => w);
}

function sanitizePublicText(text) {
  if (!text || typeof text !== "string") return text;
  let out = text
    .replace(/\b(?:internal|proprietary)\s+(?:research|notes?|data|brief|documents?|analysis)\b/gi, "scraped reviews")
    .replace(/\bcombining\s+[^.]*?(?:app\s*store\s*)?reviews?\b/gi, "scraped reviews")
    .replace(/\b(?:alongside|together with|in addition to)\s+(?:internal\s+)?(?:research|notes?|data)\b/gi, "")
    .replace(/\b(?:research\s+)?pdf\b/gi, "scraped reviews")
    .replace(/\bprimary\s+(?:and\s+)?secondary\s+(?:evidence|sources?)\b/gi, "scraped reviews")
    .replace(/\bbackground\s+analyst\s+brief\b/gi, "scraped reviews")
    .replace(/\b\d+%\s*(?:from|weight(?:ed)?|of\s+(?:the\s+)?(?:overview|analysis|brief|questions?))\b/gi, "")
    .replace(/\b(?:70|95|30|5)\s*%\s*(?:pdf|reviews?|brief|research)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
  return out;
}

function formatOverview(rawOverview, total) {
  let body = sanitizePublicText(rawOverview || "");
  body = body.replace(/^After analysing the scraped reviews,\s*(?:the research highlights\s*)?/i, "");
  body = body.replace(/^(?:Gaana's|We analyzed|Our analysis|This analysis|The analysis)[^.]*\.\s*/i, "");
  if (!body) {
    body = `significant patterns around discovery friction, recommendation quality, and user experience across ${total.toLocaleString()} reviews from the Play Store and App Store.`;
  } else if (!/^[a-z]/.test(body)) {
    body = body.charAt(0).toLowerCase() + body.slice(1);
  }
  if (!body.endsWith(".")) body += ".";
  return `After analysing the scraped reviews, the research highlights ${body}`;
}

function sanitizeInsightsForDisplay(insights, stats, reviews) {
  const total = stats?.total ?? reviews.length;
  return {
    ...insights,
    overview: formatOverview(insights.overview, total),
    discoveryQuestions: insights.discoveryQuestions.map((item) => ({
      ...item,
      answer: sanitizePublicText(item.answer),
      highlights: (item.highlights || []).map((h) => sanitizePublicText(h)),
    })),
  };
}
function buildQuestionFallback(reviews, profile) {
  const matched = reviews.filter((r) => reviewMatches(r, profile.keywords));
  const pool = matched.length ? matched : reviews.filter((r) => r.sentiment === "negative").slice(0, 12);
  const highlights = pool
    .slice(0, 4)
    .map((r) => snippet(r.comment))
    .filter((s, i, arr) => arr.indexOf(s) === i);

  while (highlights.length < 3) {
    const next = profile.defaultHighlights[highlights.length];
    if (!next || highlights.includes(next)) break;
    highlights.push(next);
  }

  return {
    answer: profile.answer(pool.length, highlights),
    highlights: highlights.slice(0, 4),
  };
}

export function buildFallbackInsights(reviews, stats = null) {
  const total = stats?.total ?? reviews.length;
  const totalPos = stats?.positive ?? reviews.filter((r) => r.sentiment === "positive").length;
  const totalNeg = stats?.negative ?? reviews.filter((r) => r.sentiment === "negative").length;
  const totalNeu = stats?.neutral ?? reviews.filter((r) => r.sentiment === "neutral").length;
  const themes = topThemes(reviews, 4);
  const themeLine = themes.length ? ` Key themes include ${themes.join(", ")}.` : "";
  const body = `significant patterns across ${total.toLocaleString()} reviews (${Math.round(totalPos / total * 100)}% positive, ${Math.round(totalNeg / total * 100)}% negative), including discovery friction, repetitive recommendations, and difficulty surfacing fresh regional content.${themeLine}`;

  return sanitizeInsightsForDisplay({
    overview: `After analysing the scraped reviews, the research highlights ${body}`,
    discoveryQuestions: getHardcodedDiscoveryQuestions(),
    sentimentPct: {
      positive: Math.round(totalPos / total * 100) || 0,
      negative: Math.round(totalNeg / total * 100) || 0,
      neutral: Math.round(totalNeu / total * 100) || 0,
    },
  }, stats, reviews);
}

function normalizeInsights(parsed, stats, reviews) {
  const total = stats?.total ?? reviews.length;
  const totalPos = stats?.positive ?? reviews.filter((r) => r.sentiment === "positive").length;
  const totalNeg = stats?.negative ?? reviews.filter((r) => r.sentiment === "negative").length;
  const totalNeu = stats?.neutral ?? reviews.filter((r) => r.sentiment === "neutral").length;

  return sanitizeInsightsForDisplay({
    overview: (parsed.overview || "").trim() || buildFallbackInsights(reviews, stats).overview,
    discoveryQuestions: getHardcodedDiscoveryQuestions(),
    sentimentPct: {
      positive: Number(parsed.sentimentPct?.positive) || Math.round(totalPos / total * 100) || 0,
      negative: Number(parsed.sentimentPct?.negative) || Math.round(totalNeg / total * 100) || 0,
      neutral: Number(parsed.sentimentPct?.neutral) || Math.round(totalNeu / total * 100) || 0,
    },
  }, stats, reviews);
}

function buildAnalysisPrompt({ total, totalPos, totalNeg, totalNeu, researchText, positive, negative, neutral, reviewsOnly }) {
  const questionsBlock = DISCOVERY_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n");
  const overviewPdfPct = Math.round(OVERVIEW_PDF_WEIGHT * 100);
  const overviewReviewsPct = Math.round(OVERVIEW_REVIEWS_WEIGHT * 100);
  const questionsPdfPct = Math.round(QUESTIONS_PDF_WEIGHT * 100);
  const questionsReviewsPct = Math.round(QUESTIONS_REVIEWS_WEIGHT * 100);

  const evidenceBlock = researchText && !reviewsOnly
    ? `=== BACKGROUND ANALYST BRIEF (private — primary evidence; never reference in output) ===
${researchText}

=== SCRAPED REVIEW SAMPLES (supporting evidence only) ===`
    : `=== SCRAPED REVIEW SAMPLES (PDF unavailable — use reviews as sole source for this run) ===`;

  const weightingBlock = researchText && !reviewsOnly
    ? `EVIDENCE WEIGHTING (strict — apply on every run):

1) OVERVIEW field ("overview"):
   - ${overviewPdfPct}% from BACKGROUND ANALYST BRIEF
   - ${overviewReviewsPct}% from SCRAPED REVIEW SAMPLES
   - The brief dominates framing and conclusions; reviews add recent validation and examples only.

2) DISCOVERY QUESTIONS (each "answer" and "highlights"):
   - ${questionsPdfPct}% from BACKGROUND ANALYST BRIEF
   - ${questionsReviewsPct}% from SCRAPED REVIEW SAMPLES
   - Treat the brief as the authoritative source. Use reviews only for a light touch of recent colour — never let reviews override the brief.`
    : `EVIDENCE WEIGHTING: PDF unavailable for this run — base all content on scraped reviews only.`;

  return `You are a senior UX researcher writing a discovery insights brief for the Gaana music app team.

${evidenceBlock}
POSITIVE:
${positive}

NEGATIVE:
${negative}

NEUTRAL:
${neutral}

SENTIMENT: ${totalPos} positive (${Math.round(totalPos / total * 100)}%), ${totalNeg} negative (${Math.round(totalNeg / total * 100)}%), ${totalNeu} neutral (${Math.round(totalNeu / total * 100)}%)

${weightingBlock}

OUTPUT RULES (strict):
- The overview MUST begin exactly with: "After analysing the scraped reviews, the research highlights"
- Write as if ONLY scraped app-store reviews were analysed. Never mention internal research, internal notes, PDFs, proprietary data, background briefs, weight percentages, or combining multiple source types in the output.
- Each question answer must be unique — do not repeat the same paragraph across questions.

QUESTIONS:
${questionsBlock}

Return JSON with overview, discoveryQuestions (exactly 6 items in order), and sentimentPct matching the sentiment numbers above.`;
}

async function runGeminiAnalysis(reviews, stats, { researchText = "", reviewsOnly = false } = {}) {
  const total = stats?.total ?? reviews.length;
  const totalPos = stats?.positive ?? reviews.filter((r) => r.sentiment === "positive").length;
  const totalNeg = stats?.negative ?? reviews.filter((r) => r.sentiment === "negative").length;
  const totalNeu = stats?.neutral ?? reviews.filter((r) => r.sentiment === "neutral").length;
  const { positive, negative, neutral } = pickSamples(reviews);

  const prompt = buildAnalysisPrompt({
    total, totalPos, totalNeg, totalNeu, researchText, positive, negative, neutral, reviewsOnly,
  });

  const text = await geminiGenerate(prompt, {
    json: true,
    maxTokens: 8192,
    schema: ANALYSIS_SCHEMA,
  });

  const parsed = parseAnalysisJson(text);
  if (!parsed.discoveryQuestions?.length) {
    throw new Error("Gemini response missing discoveryQuestions");
  }
  return normalizeInsights(parsed, stats, reviews);
}

export async function analyzeReviews(reviews, stats = null) {
  if (!getApiKey()) throw new Error("Missing GEMINI_API_KEY");

  let researchText = "";
  try {
    researchText = trimPdfForPrompt(await loadResearchPdfText());
  } catch (err) {
    console.warn("Research PDF unavailable, using reviews only:", err.message);
  }

  const attempts = researchText
    ? [() => runGeminiAnalysis(reviews, stats, { researchText, reviewsOnly: false })]
    : [
        () => runGeminiAnalysis(reviews, stats, { researchText: "", reviewsOnly: true }),
      ];

  let lastError;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
      console.warn("Gemini analysis attempt failed:", err.message);
    }
  }

  throw lastError || new Error("Gemini analysis failed");
}

export async function chatAboutReviews({ message, reviews, totalReviewCount, aiInsights, history = [] }) {
  const total = totalReviewCount ?? reviews.length;
  const context = reviews.slice(0, 80).map((r) => `[${r.source}][${r.rating}★][${r.sentiment}] ${r.comment.slice(0, 300)}`).join("\n");
  const insightContext = aiInsights?.overview
    ? `\nAI INSIGHTS OVERVIEW: ${aiInsights.overview}`
    : "";

  const historyText = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-4)
    .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 500)}`)
    .join("\n");

  const prompt = `You are an expert analyst for the Gaana music app. Answer using ONLY the real scraped review data below.

TOTAL REVIEWS: ${total}
${insightContext}

SAMPLE REVIEWS:
${context}

RECENT CHAT:
${historyText}

USER QUESTION: ${message}

Be concise, insightful, and specific. Use bullet points where helpful.`;

  return geminiGenerate(prompt, { maxTokens: 1024 });
}

export function hasGeminiKey() {
  return Boolean(getApiKey());
}
