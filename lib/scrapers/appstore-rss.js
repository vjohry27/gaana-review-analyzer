import { GAANA, SCRAPE_LIMITS } from "../config.js";
import { normalizeReview, sentimentFromRating } from "../sentiment.js";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRssUrl(pageNum) {
  return `https://itunes.apple.com/in/rss/customerreviews/id=${GAANA.appStoreId}/sortBy=mostRecent/page=${pageNum}/json`;
}

function parseRssEntries(data, pageNum) {
  const entries = data.feed?.entry || [];
  return pageNum === 1 && entries.length ? entries.slice(1) : entries;
}

function mapRssEntry(entry, pageNum, index) {
  const comment = (entry.content?.label || entry.summary?.label || "").trim();
  if (comment.length < 5) return null;

  const rating = parseInt(entry["im:rating"]?.label || "3", 10);
  return normalizeReview({
    id: `rss_${entry.id?.label || `${pageNum}_${index}`}`,
    source: "App Store RSS",
    author: entry.author?.name?.label || "appstore_user",
    rating: Number.isNaN(rating) ? 3 : rating,
    comment,
    date: entry.updated?.label
      ? new Date(entry.updated.label).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    sentiment: sentimentFromRating(Number.isNaN(rating) ? 3 : rating),
  });
}

/** Fetch a single page of Apple iTunes RSS reviews (page 1–10). */
export async function scrapeAppStoreRss(page = 1) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const url = buildRssUrl(pageNum);
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "GaanaReviewAnalyzer/2.0 (compatible; review research)",
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error(`App Store RSS failed (${res.status})`);

      const data = await res.json();
      const rows = parseRssEntries(data, pageNum);
      const reviews = rows
        .map((entry, index) => mapRssEntry(entry, pageNum, index))
        .filter(Boolean);

      if (reviews.length) return reviews;
    } catch (err) {
      lastError = err;
    }

    if (attempt < 2) await sleep(800 * (attempt + 1));
  }

  if (lastError) throw lastError;
  return [];
}

export async function scrapeAppStoreRssAll() {
  const all = [];
  for (let page = 1; page <= SCRAPE_LIMITS.appstore_rss_pages; page++) {
    const batch = await scrapeAppStoreRss(page);
    if (!batch.length) break;
    all.push(...batch);
  }
  if (!all.length) throw new Error("No App Store RSS reviews found");
  return all;
}
