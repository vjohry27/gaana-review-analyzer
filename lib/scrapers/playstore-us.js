import gplay from "google-play-scraper";
import { GAANA, SCRAPE_LIMITS } from "../config.js";
import { normalizeReview, sentimentFromRating } from "../sentiment.js";
import { mapPlayStoreReviews } from "../review-utils.js";

/** US Play Store feed — different reviewer pool from India English. */
export async function scrapePlayStoreUs() {
  const result = await gplay.reviews({
    appId: GAANA.playStoreId,
    lang: "en",
    country: "us",
    sort: gplay.sort.NEWEST,
    num: SCRAPE_LIMITS.playstore_us,
    paginate: false,
  });

  const rows = result.data || result.reviews || result || [];
  return mapPlayStoreReviews(rows, "Play Store (US)", "psu").map((r) =>
    normalizeReview({ ...r, sentiment: sentimentFromRating(r.rating) })
  );
}
