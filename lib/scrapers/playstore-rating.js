import gplay from "google-play-scraper";
import { GAANA, SCRAPE_LIMITS } from "../config.js";
import { normalizeReview, sentimentFromRating } from "../sentiment.js";
import { mapPlayStoreReviews } from "../review-utils.js";

export async function scrapePlayStoreRating() {
  const result = await gplay.reviews({
    appId: GAANA.playStoreId,
    lang: "en",
    country: "in",
    sort: gplay.sort.RATING,
    num: SCRAPE_LIMITS.playstore_rating,
    paginate: false,
  });

  const rows = result.data || result.reviews || result || [];
  return mapPlayStoreReviews(rows, "Play Store (Rated)", "psr").map((r) =>
    normalizeReview({ ...r, sentiment: sentimentFromRating(r.rating) })
  );
}
