import { scrapeAppStore } from "../lib/scrapers/appstore.js";
import { scrapeAppStoreRss } from "../lib/scrapers/appstore-rss.js";
import {
  buildAppleRssUrl,
  buildAppleWebUrls,
  APPLE_WEB_USER_AGENT,
} from "../lib/scrapers/apple-reviews.js";
import { GAANA } from "../lib/config.js";

const slug = "gaana-music-songs-podcasts";

const rssUrl = buildAppleRssUrl({
  country: "in",
  page: 1,
  appId: GAANA.appStoreId,
  sort: "mostRecent",
});
const webUrl = buildAppleWebUrls({ country: "in", appId: GAANA.appStoreId, slug })[0];

const headers = {
  "User-Agent": APPLE_WEB_USER_AGENT,
  Accept: "application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const rssRes = await fetch(rssUrl, { headers });
const rssText = await rssRes.text();
let rssEntries = 0;
try {
  rssEntries = JSON.parse(rssText).feed?.entry?.length ?? 0;
} catch {
  rssEntries = -1;
}
console.log("RSS", rssRes.status, "bytes", rssText.length, "entries", rssEntries);

const webRes = await fetch(webUrl, { headers });
const webHtml = await webRes.text();
console.log(
  "WEB",
  webRes.status,
  "bytes",
  webHtml.length,
  "serialized",
  webHtml.includes("serialized-server-data"),
  "reviewKinds",
  (webHtml.match(/"\$kind":"Review"/g) || []).length,
);

for (let page = 1; page <= 3; page++) {
  const store = await scrapeAppStore(page);
  const rss = await scrapeAppStoreRss(page);
  console.log(`page ${page}: appstore=${store.length} rss=${rss.length}`);
}
