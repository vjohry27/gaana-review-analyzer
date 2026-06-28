import store from "app-store-scraper";
import { GAANA } from "../config.js";
import { normalizeReview, sentimentFromRating } from "../sentiment.js";

let cachedAppId = null;
const COUNTRIES = ["in", "us"];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveAppId() {
  if (cachedAppId) return cachedAppId;
  for (const country of COUNTRIES) {
    try {
      const found = await store.search({ term: GAANA.appStoreSearchTerm, num: 5, country });
      const gaana = found.find((a) => /gaana/i.test(a.title) && !/dj|radio fm/i.test(a.title));
      if (gaana?.id) {
        cachedAppId = gaana.id;
        break;
      }
    } catch {
      // try next country
    }
  }
  cachedAppId = cachedAppId || GAANA.appStoreId;
  return cachedAppId;
}

function mapRows(rows, page, sourceLabel) {
  if (!rows?.length) return [];
  return rows.map((r, i) => normalizeReview({
    id: `as_${page}_${r.id || i}`,
    source: sourceLabel,
    author: r.userName || "appstore_user",
    rating: r.score,
    comment: (r.text || r.title || "").trim(),
    date: r.updated ? new Date(r.updated).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    sentiment: sentimentFromRating(r.score),
  })).filter((r) => r.comment.length > 5);
}

/** Fetch a single page of App Store reviews (page 1–10). Retries with country fallbacks. */
export async function scrapeAppStore(page = 1) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const appId = await resolveAppId();
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    for (const country of COUNTRIES) {
      try {
        const rows = await store.reviews({
          id: appId,
          country,
          page: pageNum,
          sort: store.sort.RECENT,
        });
        const reviews = mapRows(rows, pageNum, "App Store");
        if (reviews.length) return reviews;
      } catch (err) {
        lastError = err;
      }
    }
    if (attempt < 2) await sleep(900 * (attempt + 1));
  }

  if (lastError) throw lastError;
  return [];
}
