import { scrapeSource } from "../lib/scrape.js";
import { analyzeReviews, buildFallbackInsights } from "../lib/ai.js";
import { MIN_REVIEWS_TARGET, GAANA } from "../lib/config.js";
import { scrapeAppleReviewPage } from "../lib/scrapers/apple-reviews.js";

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export async function handleScrape(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const sourceId = (req.query?.source || req.body?.source || "").toLowerCase();
  const page = req.query?.page || req.body?.page;

  if (!sourceId) {
    return res.status(400).json({
      error: "Missing source (playstore, playstore_rating, playstore_helpful, playstore_us, playstore_hindi, appstore, appstore_rss). Optional: page for appstore/appstore_rss.",
    });
  }

  try {
    const result = await scrapeSource(sourceId, { page });
    return res.status(200).json({ ...result, minTarget: MIN_REVIEWS_TARGET });
  } catch (err) {
    return res.status(502).json({
      error: err.message || "Scrape failed",
      sourceId,
      page: page || null,
      reviews: [],
      count: 0,
    });
  }
}

export async function handleAnalyze(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const { reviews, stats } = req.body || {};
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return res.status(400).json({ error: "reviews array required" });
  }

  try {
    const insights = await analyzeReviews(reviews, stats);
    return res.status(200).json({ insights, aiGenerated: true });
  } catch (err) {
    console.error("Analyze error:", err.message);
    return res.status(200).json({
      insights: buildFallbackInsights(reviews, stats),
      fallback: true,
      error: err.message,
    });
  }
}

export async function handleChat(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const { message, reviews, totalReviewCount, aiInsights, history } = req.body || {};
  if (!message?.trim()) return res.status(400).json({ error: "message required" });
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return res.status(400).json({ error: "reviews required — scrape first" });
  }

  try {
    const { chatAboutReviews } = await import("../lib/ai.js");
    const reply = await chatAboutReviews({
      message,
      reviews,
      totalReviewCount,
      aiInsights,
      history: history || [],
    });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat error:", err.message);
    return res.status(502).json({
      error: err.message || "Chat failed",
      reply: `AI error: ${err.message || "Could not reach Gemini. Try again."}`,
    });
  }
}

export async function handleHealth(req, res) {
  setCors(res);

  let appleStoreCount = 0;
  let appleRssCount = 0;
  let appleError = null;

  try {
    const [store, rss] = await Promise.all([
      scrapeAppleReviewPage({
        appId: GAANA.appStoreId,
        slug: "gaana-music-songs-podcasts",
        page: 1,
        sourceLabel: "App Store",
        idPrefix: "health_as",
        rssSort: "mostRecent",
        webCountryOffset: 0,
      }),
      scrapeAppleReviewPage({
        appId: GAANA.appStoreId,
        slug: "gaana-music-songs-podcasts",
        page: 1,
        sourceLabel: "App Store RSS",
        idPrefix: "health_rss",
        rssSort: "mostHelpful",
        webCountryOffset: 5,
      }),
    ]);
    appleStoreCount = store.length;
    appleRssCount = rss.length;
  } catch (err) {
    appleError = err.message;
  }

  return res.status(200).json({
    ok: true,
    gemini: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
    minReviewsTarget: MIN_REVIEWS_TARGET,
    apple: {
      appStore: appleStoreCount,
      appStoreRss: appleRssCount,
      ready: appleStoreCount > 0 && appleRssCount > 0,
      error: appleError,
    },
    scraperVersion: "apple-web-v3",
  });
}
