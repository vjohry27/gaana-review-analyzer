/** Gaana app identifiers and scrape targets. */
export const GAANA = {
  playStoreId: "com.gaana",
  appStoreId: 585270521,
  appStoreSearchTerm: "Gaana",
};

/** Minimum reviews required for a successful scrape run. */
export const MIN_REVIEWS_TARGET = 7000;

export const SOURCES = [
  { id: "appstore", label: "App Store", color: "#007aff", pages: 10 },
  { id: "appstore_rss", label: "App Store RSS", color: "#5ac8fa", pages: 10 },
  { id: "playstore", label: "Play Store", color: "#34a853" },
  { id: "playstore_rating", label: "Play Store (Rated)", color: "#2d9348" },
  { id: "playstore_helpful", label: "Play Store (Helpful)", color: "#22c55e" },
  { id: "playstore_us", label: "Play Store (US)", color: "#16a34a" },
  { id: "playstore_hindi", label: "Play Store (Hindi)", color: "#f59e0b" },
];

export const SCRAPE_LIMITS = {
  playstore: 2800,
  playstore_rating: 800,
  playstore_helpful: 1000,
  playstore_us: 2800,
  playstore_hindi: 800,
  appstore_per_page: 50,
  appstore_pages: 10,
  appstore_rss_pages: 10,
};

/** Research PDF gets 65% weight in AI analysis; live reviews get 35%. */
export const RESEARCH_PDF_WEIGHT = 0.65;
export const REVIEWS_WEIGHT = 0.35;

export const RESEARCH_PDF_FILENAME = "Gaana User Review Analysis Research.pdf";

export const SOURCE_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
export const SOURCE_LABELS = SOURCES.map((s) => s.label);
