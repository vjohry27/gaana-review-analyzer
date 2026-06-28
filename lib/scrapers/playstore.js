import gplay from "google-play-scraper";
import { GAANA, SCRAPE_LIMITS } from "../config.js";
import { normalizeReview, sentimentFromRating } from "../sentiment.js";
import { mapPlayStoreReviews } from "../review-utils.js";

export async function scrapePlayStore() {
  const result = await gplay.reviews({
    appId: GAANA.playStoreId,
    lang: "en",
    country: "in",
    sort: gplay.sort.NEWEST,
    num: SCRAPE_LIMITS.playstore,
    paginate: false,
  });

  const rows = result.data || result.reviews || result || [];
  return mapPlayStoreReviews(rows, "Play Store", "ps").map((r) =>
    normalizeReview({ ...r, sentiment: sentimentFromRating(r.rating) })
  );
}
