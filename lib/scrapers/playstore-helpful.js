import gplay from "google-play-scraper";
import { GAANA, SCRAPE_LIMITS } from "../config.js";
import { normalizeReview, sentimentFromRating } from "../sentiment.js";
import { mapPlayStoreReviews } from "../review-utils.js";

/** Most helpful Play Store reviews — surfaces recurring themes. */
export async function scrapePlayStoreHelpful() {
  const result = await gplay.reviews({
    appId: GAANA.playStoreId,
    lang: "en",
    country: "in",
    sort: gplay.sort.HELPFULNESS,
    num: SCRAPE_LIMITS.playstore_helpful,
    paginate: false,
  });

  const rows = result.data || result.reviews || result || [];
  return mapPlayStoreReviews(rows, "Play Store (Helpful)", "pshlp").map((r) =>
    normalizeReview({ ...r, sentiment: sentimentFromRating(r.rating) })
  );
}
