import { scrapePlayStore } from "./scrapers/playstore.js";
import { scrapePlayStoreRating } from "./scrapers/playstore-rating.js";
import { scrapePlayStoreHelpful } from "./scrapers/playstore-helpful.js";
import { scrapePlayStoreUs } from "./scrapers/playstore-us.js";
import { scrapePlayStoreHindi } from "./scrapers/playstore-hindi.js";
import { scrapeAppStore } from "./scrapers/appstore.js";
import { scrapeAppStoreRss, scrapeAppStoreRssAll } from "./scrapers/appstore-rss.js";
import { SOURCE_BY_ID, SCRAPE_LIMITS } from "./config.js";

const SCRAPERS = {
  playstore: scrapePlayStore,
  playstore_rating: scrapePlayStoreRating,
  playstore_helpful: scrapePlayStoreHelpful,
  playstore_us: scrapePlayStoreUs,
  playstore_hindi: scrapePlayStoreHindi,
};

export async function scrapeSource(sourceId, { page } = {}) {
  const meta = SOURCE_BY_ID[sourceId];
  if (!meta) throw new Error(`Unknown source: ${sourceId}`);

  const started = Date.now();
  let reviews = [];

  if (sourceId === "appstore") {
    reviews = await scrapeAppStore(page || 1);
  } else if (sourceId === "appstore_rss") {
    reviews = page ? await scrapeAppStoreRss(page) : await scrapeAppStoreRssAll();
  } else {
    const scraper = SCRAPERS[sourceId];
    if (!scraper) throw new Error(`Unknown source: ${sourceId}`);
    reviews = await scraper();
  }

  return {
    source: meta.label,
    sourceId,
    page: page || null,
    count: reviews.length,
    reviews,
    durationMs: Date.now() - started,
  };
}

export { SCRAPERS, SCRAPE_LIMITS };
