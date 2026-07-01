import { scrapeAppStore } from "../lib/scrapers/appstore.js";
import { scrapeAppStoreRss } from "../lib/scrapers/appstore-rss.js";

async function scrapeAllPages(name, fn, pages = 10) {
  const all = [];
  for (let p = 1; p <= pages; p++) {
    const batch = await fn(p);
    console.log(`${name} page ${p}: ${batch.length}`);
    if (!batch.length) break;
    all.push(...batch);
  }
  return all;
}

const store = await scrapeAllPages("appstore", scrapeAppStore);
const rss = await scrapeAllPages("rss", scrapeAppStoreRss);
console.log("TOTAL appstore", store.length, "rss", rss.length);
