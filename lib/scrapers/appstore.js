import { GAANA } from "../config.js";
import { scrapeAppleReviewPage } from "./apple-reviews.js";

const APP_SLUG = "gaana-music-songs-podcasts";

/** Fetch a single page of App Store reviews (page 1–10). */
export async function scrapeAppStore(page = 1) {
  return scrapeAppleReviewPage({
    appId: GAANA.appStoreId,
    slug: APP_SLUG,
    page,
    sourceLabel: "App Store",
    idPrefix: "as",
    rssSort: "mostRecent",
    webCountryOffset: 0,
  });
}
