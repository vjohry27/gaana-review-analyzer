import { RESEARCH_PDF_WEIGHT, REVIEWS_WEIGHT } from "./config.js";
import { loadResearchPdfText } from "./research-pdf.js";

const GEMINI_MODEL = "gemini-2.5-flash";

export const DISCOVERY_QUESTIONS = [
  "Why do users struggle to discover new music?",
  "What are the most common frustrations with recommendations?",
  "What listening behaviors are users trying to achieve?",
  "What causes users to listen to the same content repeatedly?",
  "Which user segments experience different discovery challenges?",
  "What unmet needs emerge consistently across reviews?",
];

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
}

async function geminiGenerate(prompt, { json = false, maxTokens = 1200 } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.35,
        ...(json ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Gemini API request failed");
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text.trim()) throw new Error("Gemini returned an empty response");
  return text.trim();
}

function pickSamples(reviews, limit = 350) {
  const sample = reviews.slice(0, limit);
  return {
    positive: sample.filter((r) => r.sentiment === "positive").slice(0, 50).map((r) => `[${r.source}] ${r.comment}`).join("\n"),
    negative: sample.filter((r) => r.sentiment === "negative").slice(0, 50).map((r) => `[${r.source}] ${r.comment}`).join("\n"),
    neutral: sample.filter((r) => r.sentiment === "neutral").slice(0, 25).map((r) => `[${r.source}] ${r.comment}`).join("\n"),
  };
}

function trimPdfForPrompt(text, maxChars = 28000) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[Document truncated for analysis — remainder omitted]`;
}

export function buildFallbackInsights(reviews, stats = null) {
  const total = stats?.total ?? reviews.length;
  const totalPos = stats?.positive ?? reviews.filter((r) => r.sentiment === "positive").length;
  const totalNeg = stats?.negative ?? reviews.filter((r) => r.sentiment === "negative").length;
  const totalNeu = stats?.neutral ?? reviews.filter((r) => r.sentiment === "neutral").length;

  return {
    overview: `We analyzed ${total.toLocaleString()} live Gaana app reviews. Users often hit repetitive recommendation loops, weak search, and buried new features — while still valuing Gaana's regional catalog when they can find fresh content.`,
    discoveryQuestions: DISCOVERY_QUESTIONS.map((question) => ({
      question,
      answer: "Live review data suggests discovery friction around search accuracy, repetitive autoplay, and difficulty surfacing new artists — especially for paying subscribers who expect smarter recommendations.",
      highlights: [
        "Repetitive daily mixes and autoplay loops",
        "Exact-match search struggles with typos and mood queries",
        "Regional strength but weak breakout-artist surfacing",
      ],
    })),
    sentimentPct: {
      positive: Math.round(totalPos / total * 100) || 0,
      negative: Math.round(totalNeg / total * 100) || 0,
      neutral: Math.round(totalNeu / total * 100) || 0,
    },
  };
}

export async function analyzeReviews(reviews, stats = null) {
  const total = stats?.total ?? reviews.length;
  const totalPos = stats?.positive ?? reviews.filter((r) => r.sentiment === "positive").length;
  const totalNeg = stats?.negative ?? reviews.filter((r) => r.sentiment === "negative").length;
  const totalNeu = stats?.neutral ?? reviews.filter((r) => r.sentiment === "neutral").length;

  const researchText = trimPdfForPrompt(await loadResearchPdfText());
  const { positive, negative, neutral } = pickSamples(reviews);

  const questionsBlock = DISCOVERY_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n");

  const prompt = `You are a senior UX researcher writing an easy-to-read discovery insights brief for the Gaana music app team.

You have TWO evidence sources. Weight them strictly:
- PRIMARY (${Math.round(RESEARCH_PDF_WEIGHT * 100)}%): Internal research PDF below — treat as the main truth for patterns, percentages, and strategic framing.
- SECONDARY (${Math.round(REVIEWS_WEIGHT * 100)}%): ${total} live scraped app-store reviews — use to validate, nuance, or add recent examples. Never let live reviews override the PDF's core findings.

SENTIMENT OF LIVE REVIEWS: ${totalPos} positive (${Math.round(totalPos / total * 100)}%), ${totalNeg} negative (${Math.round(totalNeg / total * 100)}%), ${totalNeu} neutral (${Math.round(totalNeu / total * 100)}%)

=== PRIMARY RESEARCH PDF (65% weight) ===
${researchText}

=== LIVE REVIEW SAMPLES (35% weight) ===
POSITIVE:
${positive}

NEGATIVE:
${negative}

NEUTRAL:
${neutral}

Write for busy stakeholders: plain language, short paragraphs, scannable bullets. Avoid jargon walls.

Answer ALL six questions below directly. Each answer must blend PDF insights (dominant) with live review evidence (supporting).

QUESTIONS:
${questionsBlock}

Return JSON only:
{
  "overview": "2-3 friendly sentences summarizing the discovery story",
  "discoveryQuestions": [
    {
      "question": "exact question text",
      "answer": "2-4 short sentences in plain English",
      "highlights": ["3-5 punchy bullet strings"]
    }
  ],
  "sentimentPct": { "positive": number, "negative": number, "neutral": number }
}

Include exactly 6 items in discoveryQuestions matching the questions above in order. sentimentPct must reflect the live review breakdown numbers given.`;

  const text = await geminiGenerate(prompt, { json: true, maxTokens: 4096 });
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean);
    if (!parsed.discoveryQuestions?.length) throw new Error("Missing discoveryQuestions");
    parsed.sentimentPct = parsed.sentimentPct || {
      positive: Math.round(totalPos / total * 100),
      negative: Math.round(totalNeg / total * 100),
      neutral: Math.round(totalNeu / total * 100),
    };
    return parsed;
  } catch {
    throw new Error("Gemini returned invalid JSON for analysis");
  }
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
