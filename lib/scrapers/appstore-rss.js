import { GAANA, SCRAPE_LIMITS } from "../config.js";
import { scrapeAppleReviewPage, scrapeAppleReviewPages } from "./apple-reviews.js";

const APP_SLUG = "gaana-music-songs-podcasts";

/** Fetch a single page of Apple iTunes RSS reviews (page 1–10). */
export async function scrapeAppStoreRss(page = 1) {
  return scrapeAppleReviewPage({
    appId: GAANA.appStoreId,
    slug: APP_SLUG,
    page,
    sourceLabel: "App Store RSS",
    idPrefix: "rss",
    rssSort: "mostHelpful",
    webCountryOffset: 5,
  });
}

export async function scrapeAppStoreRssAll() {
  const all = await scrapeAppleReviewPages({
    appId: GAANA.appStoreId,
    slug: APP_SLUG,
    pages: SCRAPE_LIMITS.appstore_rss_pages,
    sourceLabel: "App Store RSS",
    idPrefix: "rss",
    rssSort: "mostHelpful",
    webCountryOffset: 5,
  });
  if (!all.length) throw new Error("No App Store RSS reviews found");
  return all;
}
