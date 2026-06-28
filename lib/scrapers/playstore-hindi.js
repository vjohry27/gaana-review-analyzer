import gplay from "google-play-scraper";
import { GAANA, SCRAPE_LIMITS } from "../config.js";
import { normalizeReview, sentimentFromRating } from "../sentiment.js";
import { mapPlayStoreReviews } from "../review-utils.js";

/** Hindi/regional Play Store reviews — same app, different language feed (unique from English). */
export async function scrapePlayStoreHindi() {
  const result = await gplay.reviews({
    appId: GAANA.playStoreId,
    lang: "hi",
    country: "in",
    sort: gplay.sort.NEWEST,
    num: SCRAPE_LIMITS.playstore_hindi,
    paginate: false,
  });

  const rows = result.data || result.reviews || result || [];
  return mapPlayStoreReviews(rows, "Play Store (Hindi)", "psh").map((r) =>
    normalizeReview({ ...r, sentiment: sentimentFromRating(r.rating) })
  );
}
