import { normalizeReview, sentimentFromRating } from "../sentiment.js";

export const APPLE_RSS_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export const APPLE_WEB_USER_AGENT = APPLE_RSS_USER_AGENT;

export const APPLE_RSS_COUNTRIES = ["in", "us", "gb", "au", "ca"];
export const APPLE_WEB_COUNTRIES = [
  "in", "us", "gb", "au", "ca", "ae", "de", "fr", "sg", "jp",
];

const REQUEST_HEADERS = {
  "User-Agent": APPLE_WEB_USER_AGENT,
  Accept: "application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export function buildAppleRssUrl({ country = "in", page = 1, appId, sort = "mostRecent" }) {
  return `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=${sort}/json`;
}

export function buildAppleWebUrls({ country = "in", appId, slug }) {
  const urls = [];
  if (slug) urls.push(`https://apps.apple.com/${country}/app/${slug}/id${appId}`);
  urls.push(`https://apps.apple.com/${country}/app/id${appId}`);
  return urls;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isThrottledRssPayload(text, data) {
  const entries = data?.feed?.entry;
  const count = Array.isArray(entries) ? entries.length : entries ? 1 : 0;
  return count === 0 && text.length < 2500;
}

export function parseRssEntries(data, pageNum) {
  const entries = data?.feed?.entry || [];
  const rows = Array.isArray(entries) ? entries : entries ? [entries] : [];
  return pageNum === 1 && rows.length ? rows.slice(1) : rows;
}

export function mapRssEntry(entry, pageNum, index, sourceLabel, idPrefix) {
  const comment = (entry.content?.label || entry.summary?.label || "").trim();
  if (comment.length < 5) return null;

  const rating = parseInt(entry["im:rating"]?.label || "3", 10);
  const safeRating = Number.isNaN(rating) ? 3 : rating;

  return normalizeReview({
    id: `${idPrefix}_${entry.id?.label || `${pageNum}_${index}`}`,
    source: sourceLabel,
    author: entry.author?.name?.label || "appstore_user",
    rating: safeRating,
    comment,
    date: entry.updated?.label
      ? new Date(entry.updated.label).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    sentiment: sentimentFromRating(safeRating),
  });
}

function extractWebReviews(data) {
  const out = [];

  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.$kind === "Review") out.push(node);
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    Object.values(node).forEach(walk);
  }

  walk(data);
  return out;
}

export function mapWebReview(review, country, sourceLabel, idPrefix, pageNum) {
  const comment = (review.contents || review.title || "").trim();
  if (comment.length < 5) return null;

  const rating = parseInt(review.rating, 10);
  const safeRating = Number.isNaN(rating) ? 3 : rating;

  return normalizeReview({
    id: `${idPrefix}_${country}_p${pageNum}_${review.id}`,
    source: sourceLabel,
    author: review.reviewerName || "appstore_user",
    rating: safeRating,
    comment,
    date: review.date
      ? new Date(review.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    sentiment: sentimentFromRating(safeRating),
  });
}

function parseWebHtml(html, country, sourceLabel, idPrefix, pageNum) {
  const match = html.match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return [];

  const data = JSON.parse(match[1]);
  return extractWebReviews(data)
    .map((review) => mapWebReview(review, country, sourceLabel, idPrefix, pageNum))
    .filter(Boolean);
}

export async function fetchRssReviewsPage({
  appId,
  page,
  country,
  sort,
  sourceLabel,
  idPrefix,
}) {
  const url = buildAppleRssUrl({ country, page, appId, sort });
  const res = await fetch(url, { headers: REQUEST_HEADERS });
  if (!res.ok) throw new Error(`App Store RSS failed (${res.status})`);

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("App Store RSS returned invalid JSON");
  }

  if (isThrottledRssPayload(text, data)) return [];

  return parseRssEntries(data, page)
    .map((entry, index) => mapRssEntry(entry, page, index, sourceLabel, idPrefix))
    .filter(Boolean);
}

export async function fetchWebReviewsForCountry({
  appId,
  slug,
  country,
  sourceLabel,
  idPrefix,
  pageNum,
}) {
  const urls = buildAppleWebUrls({ country, appId, slug });

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: REQUEST_HEADERS });
      if (!res.ok) continue;

      const html = await res.text();
      const reviews = parseWebHtml(html, country, sourceLabel, idPrefix, pageNum);
      if (reviews.length) return reviews;
    } catch {
      // try next URL shape
    }
  }

  return [];
}

function orderedCountries(pageNum, offset = 0) {
  const countries = APPLE_WEB_COUNTRIES;
  const start = (pageNum - 1 + offset) % countries.length;
  return [...countries.slice(start), ...countries.slice(0, start)];
}

export async function scrapeAppleReviewPage({
  appId,
  slug,
  page = 1,
  sourceLabel,
  idPrefix,
  rssSort,
  webCountryOffset = 0,
}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  let lastError;

  for (const country of APPLE_RSS_COUNTRIES) {
    try {
      const reviews = await fetchRssReviewsPage({
        appId,
        page: pageNum,
        country,
        sort: rssSort,
        sourceLabel,
        idPrefix,
      });
      if (reviews.length) return reviews;
    } catch (err) {
      lastError = err;
    }
  }

  for (const country of orderedCountries(pageNum, webCountryOffset)) {
    try {
      const reviews = await fetchWebReviewsForCountry({
        appId,
        slug,
        country,
        sourceLabel,
        idPrefix,
        pageNum,
      });
      if (reviews.length) return reviews;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  return [];
}

export async function scrapeAppleReviewPages({
  appId,
  slug,
  pages = 10,
  sourceLabel,
  idPrefix,
  rssSort,
  webCountryOffset = 0,
}) {
  const all = [];
  const seenIds = new Set();

  for (let page = 1; page <= pages; page++) {
    const batch = await scrapeAppleReviewPage({
      appId,
      slug,
      page,
      sourceLabel,
      idPrefix,
      rssSort,
      webCountryOffset,
    });

    if (!batch.length) break;

    for (const review of batch) {
      if (seenIds.has(review.id)) continue;
      seenIds.add(review.id);
      all.push(review);
    }

    if (page < pages) await sleep(350);
  }

  return all;
}
