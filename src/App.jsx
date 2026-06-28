import { useState, useCallback, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Legend
} from "recharts";

const SOURCES = [
  { id: "appstore", label: "App Store", pages: 10 },
  { id: "appstore_rss", label: "App Store RSS", pages: 10 },
  { id: "playstore", label: "Play Store" },
  { id: "playstore_rating", label: "Play Store (Rated)" },
  { id: "playstore_helpful", label: "Play Store (Helpful)" },
  { id: "playstore_us", label: "Play Store (US)" },
  { id: "playstore_hindi", label: "Play Store (Hindi)" },
];
const SOURCE_LABELS = SOURCES.map((s) => s.label);
const SOURCE_COLORS = {
  "Play Store": "#34a853",
  "Play Store (Rated)": "#2d9348",
  "Play Store (Helpful)": "#22c55e",
  "Play Store (US)": "#16a34a",
  "App Store": "#007aff",
  "App Store RSS": "#5ac8fa",
  "Play Store (Hindi)": "#f59e0b",
};
const TOTAL_SCRAPE_STEPS = SOURCES.reduce((n, s) => n + (s.pages || 1), 0);
const THEME_STORAGE_KEY = "gaana-review-analyzer-theme";
const SIDE_CHART_HEIGHT = 280;

function createStyles(theme) {
  const dark = theme === "dark";
  return {
    app: { minHeight: "100vh", background: dark ? "#0a0a0f" : "#f8fafc", color: dark ? "#e2e8f0" : "#1e293b", fontFamily: "'Inter', sans-serif", transition: "background 0.2s ease, color 0.2s ease" },
    header: { position: "sticky", top: 0, zIndex: 100, backdropFilter: dark ? "blur(12px)" : "blur(10px)", WebkitBackdropFilter: dark ? "blur(12px)" : "blur(10px)", background: dark ? "linear-gradient(135deg, rgba(15,15,26,0.92) 0%, rgba(26,10,46,0.92) 50%, rgba(10,22,40,0.92) 100%)" : "linear-gradient(135deg, rgba(248,250,252,0.92) 0%, rgba(237,233,254,0.92) 50%, rgba(224,242,254,0.92) 100%)", borderBottom: dark ? "1px solid rgba(139,92,246,0.2)" : "1px solid rgba(124,58,237,0.15)", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
    headerActions: { display: "flex", alignItems: "center", gap: 10 },
    logo: { display: "flex", alignItems: "center", gap: 14 },
    logoIcon: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
    appName: { fontSize: 22, fontWeight: 800, background: "linear-gradient(90deg, #a78bfa, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    appSub: { fontSize: 12, color: dark ? "#64748b" : "#94a3b8", marginTop: 2, fontStyle: "italic" },
    themeBtn: { background: dark ? "#1e1e2e" : "#ffffff", border: dark ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(124,58,237,0.2)", color: dark ? "#cbd5e1" : "#475569", padding: "8px 14px", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer" },
    scrapeBtn: { background: "linear-gradient(135deg, #7c3aed, #ec4899)", border: "none", color: "#fff", padding: "10px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 },
    progressWrap: { margin: "24px 32px", background: dark ? "#111118" : "#ffffff", border: dark ? "1px solid rgba(139,92,246,0.15)" : "1px solid rgba(124,58,237,0.12)", borderRadius: 16, padding: 24 },
    progressTitle: { fontSize: 15, fontWeight: 700, color: dark ? "#a78bfa" : "#7c3aed", marginBottom: 16 },
    progressBar: { height: 6, background: dark ? "#1e1e2e" : "#e2e8f0", borderRadius: 99, overflow: "hidden", marginBottom: 16 },
    progressFill: (pct) => ({ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #ec4899)", borderRadius: 99, transition: "width 0.4s ease" }),
    sourceRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 13 },
    sourceStatus: (s) => ({ width: 8, height: 8, borderRadius: "50%", background: s === "done" ? "#4ade80" : s === "active" ? "#fbbf24" : s === "failed" ? "#f87171" : dark ? "#334155" : "#cbd5e1", flexShrink: 0 }),
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, padding: "24px 32px" },
    fullWidth: { gridColumn: "1 / -1" },
    card: { background: dark ? "#111118" : "#ffffff", border: dark ? "1px solid rgba(139,92,246,0.12)" : "1px solid rgba(148,163,184,0.25)", borderRadius: 16, padding: 22, position: "relative", overflow: "visible", display: "flex", flexDirection: "column" },
    chartBody: { flex: 1, minHeight: SIDE_CHART_HEIGHT },
    aiBadge: (dark) => dark
      ? { background: "rgba(74,222,128,0.15)", color: "#86efac", border: "1px solid rgba(74,222,128,0.28)" }
      : { background: "#ecfdf5", color: "#047857", border: "1px solid #6ee7b7" },
    cardTitle: { fontSize: 14, fontWeight: 700, color: dark ? "#94a3b8" : "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, padding: "0 32px 0" },
    statCard: (accent) => ({ background: dark ? "#111118" : "#ffffff", border: `1px solid ${accent}30`, borderRadius: 14, padding: "16px 20px", borderTop: `3px solid ${accent}` }),
    statValue: { fontSize: 28, fontWeight: 800, color: dark ? "#f1f5f9" : "#0f172a" },
    statLabel: { fontSize: 12, color: dark ? "#64748b" : "#94a3b8", marginTop: 4 },
    reviewPanel: { margin: "0 32px 32px", background: dark ? "#111118" : "#ffffff", border: dark ? "1px solid rgba(139,92,246,0.2)" : "1px solid rgba(148,163,184,0.25)", borderRadius: 16, padding: "20px 24px" },
    reviewCard: { background: dark ? "#0f0f1a" : "#f8fafc", border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(148,163,184,0.2)", borderRadius: 10, padding: 14, marginBottom: 10 },
    reviewMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
    badge: (color) => ({ background: color + "20", color: color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, letterSpacing: "0.04em" }),
    stars: (n) => "★".repeat(n) + "☆".repeat(5 - n),
    filterRow: { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" },
    filterSelect: { background: dark ? "#0f0f1a" : "#ffffff", border: dark ? "1px solid rgba(139,92,246,0.2)" : "1px solid rgba(148,163,184,0.35)", color: dark ? "#cbd5e1" : "#334155", padding: "6px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" },
    empty: { textAlign: "center", padding: "80px 32px", color: dark ? "#475569" : "#64748b" },
    emptyIcon: { fontSize: 64, marginBottom: 20, display: "block" },
    emptyTitle: { fontSize: 22, fontWeight: 700, color: dark ? "#64748b" : "#475569", marginBottom: 28 },
    qaBlock: { marginBottom: 22, paddingBottom: 22, borderBottom: dark ? "1px solid rgba(139,92,246,0.1)" : "1px solid rgba(148,163,184,0.2)" },
    qaQuestion: { fontSize: 15, fontWeight: 700, color: dark ? "#e2e8f0" : "#1e293b", marginBottom: 8, lineHeight: 1.4 },
    qaAnswer: { fontSize: 14, color: dark ? "#cbd5e1" : "#475569", lineHeight: 1.75, marginBottom: 10 },
    qaBullet: { fontSize: 13, color: dark ? "#a5b4fc" : "#6366f1", marginBottom: 5, paddingLeft: 16, position: "relative", lineHeight: 1.5 },
    summaryCard: (dark) => ({ margin: "0 32px 24px", background: dark ? "linear-gradient(135deg, #0f0f1a, #1a0a2e)" : "linear-gradient(135deg, #ffffff, #f5f3ff)" }),
    chartGrid: dark ? "#1e1e2e" : "#e2e8f0",
    chartTick: dark ? "#64748b" : "#64748b",
    chartLegend: dark ? "#64748b" : "#64748b",
    tooltip: dark
      ? { backgroundColor: "#1a1a2e", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }
      : { backgroundColor: "#ffffff", border: "1px solid rgba(148,163,184,0.35)", borderRadius: 8, color: "#1e293b", fontSize: 12 },
    mutedText: dark ? "#94a3b8" : "#64748b",
    faintText: dark ? "#475569" : "#94a3b8",
    dimText: dark ? "#334155" : "#cbd5e1",
    bodyBg: dark ? "#0a0a0f" : "#f8fafc",
    bodyColor: dark ? "#e2e8f0" : "#1e293b",
  };
}

function RatingDistChart({ reviews, styles }) {
  const data = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r}★`,
    count: reviews.filter((rv) => rv.rating === r).length,
  }));
  return (
    <div style={styles.chartBody}>
      <ResponsiveContainer width="100%" height={SIDE_CHART_HEIGHT}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} />
          <XAxis dataKey="rating" tick={{ fill: styles.chartTick, fontSize: 12 }} />
          <YAxis tick={{ fill: styles.chartTick, fontSize: 11 }} />
          <Tooltip contentStyle={styles.tooltip} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={["#f87171", "#fb923c", "#fbbf24", "#a3e635", "#4ade80"][i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SourceReviewsChart({ reviews, styles, theme }) {
  const labelFill = theme === "dark" ? "#94a3b8" : "#64748b";
  const data = SOURCE_LABELS.map((s) => {
    const count = reviews.filter((r) => r.source === s).length;
    return {
      name: s,
      count,
      label: count.toLocaleString(),
    };
  });

  return (
    <div style={styles.chartBody}>
      <ResponsiveContainer width="100%" height={SIDE_CHART_HEIGHT}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 56, left: 0, bottom: 4 }}
          barCategoryGap="16%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} horizontal={false} />
          <XAxis type="number" tick={{ fill: styles.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={124}
            tick={{ fill: styles.chartTick, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={styles.tooltip}
            formatter={(value, _name, entry) => [Number(value).toLocaleString(), entry.payload.name]}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            label={{ dataKey: "label", position: "right", fill: labelFill, fontSize: 10 }}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={SOURCE_COLORS[d.name] || "#7c3aed"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SentimentTrendChart({ reviews, styles }) {
  const months = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const monthRevs = reviews.filter((r) => r.date.startsWith(key));
    months.push({
      month: label,
      Positive: monthRevs.filter((r) => r.sentiment === "positive").length,
      Negative: monthRevs.filter((r) => r.sentiment === "negative").length,
      Neutral: monthRevs.filter((r) => r.sentiment === "neutral").length,
    });
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={months} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} />
        <XAxis dataKey="month" tick={{ fill: styles.chartTick, fontSize: 10 }} />
        <YAxis tick={{ fill: styles.chartTick, fontSize: 10 }} />
        <Tooltip contentStyle={styles.tooltip} />
        <Legend wrapperStyle={{ fontSize: 11, color: styles.chartLegend }} />
        <Line type="monotone" dataKey="Positive" stroke="#4ade80" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Negative" stroke="#f87171" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Neutral" stroke="#94a3b8" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function DiscoverySummary({ insights, styles, theme }) {
  if (!insights) return null;
  const dark = theme === "dark";

  return (
    <div style={{ ...styles.card, ...styles.summaryCard(dark) }}>
      <div style={{ ...styles.cardTitle, justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>📝 AI Discovery Summary</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "none",
            letterSpacing: 0,
            padding: "4px 10px",
            borderRadius: 99,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            ...styles.aiBadge(dark),
          }}
        >
          <span aria-hidden="true">✨</span>
          Powered by Gemini
        </span>
      </div>

      {insights.overview && (
        <p style={{ fontSize: 15, lineHeight: 1.8, color: dark ? "#e2e8f0" : "#1e293b", margin: "0 0 24px", fontWeight: 500 }}>
          {insights.overview}
        </p>
      )}

      {(insights.discoveryQuestions || []).map((item, i) => (
        <div key={i} style={{ ...styles.qaBlock, ...(i === insights.discoveryQuestions.length - 1 ? { borderBottom: "none", marginBottom: 0, paddingBottom: 0 } : {}) }}>
          <div style={styles.qaQuestion}>{item.question}</div>
          <p style={styles.qaAnswer}>{item.answer}</p>
          {(item.highlights || []).map((h, j) => (
            <div key={j} style={styles.qaBullet}>• {h}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("idle");
  const [sourceStatus, setSourceStatus] = useState({});
  const [sourceCounts, setSourceCounts] = useState({});
  const [reviews, setReviews] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filterSource, setFilterSource] = useState("All Sources");
  const [filterRating, setFilterRating] = useState("All");
  const [filterSentiment, setFilterSentiment] = useState("All");
  const [scrapeErrors, setScrapeErrors] = useState({});
  const [scrapeStep, setScrapeStep] = useState(0);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  const PAGE_SIZE = 15;
  const styles = createStyles(theme);
  const dark = theme === "dark";

  useEffect(() => {
    document.body.style.background = styles.bodyBg;
    document.body.style.color = styles.bodyColor;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme, styles.bodyBg, styles.bodyColor]);

  async function fetchApi(url, options = {}, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fetch(url, options);
      } catch (err) {
        if (attempt === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }

  function buildReviewStats(list) {
    return {
      total: list.length,
      positive: list.filter((r) => r.sentiment === "positive").length,
      negative: list.filter((r) => r.sentiment === "negative").length,
      neutral: list.filter((r) => r.sentiment === "neutral").length,
    };
  }

  function compactReviewsForApi(list, limit = 400) {
    return list.slice(0, limit).map((r) => ({
      source: r.source,
      rating: r.rating,
      sentiment: r.sentiment,
      comment: r.comment.slice(0, 400),
    }));
  }

  function resetApp() {
    setPhase("idle");
    setReviews([]);
    setAiInsights(null);
    setSourceStatus({});
    setSourceCounts({});
    setScrapeErrors({});
    setTotalCount(0);
    setScrapeStep(0);
    setPage(1);
    setFilterSource("All Sources");
    setFilterRating("All");
    setFilterSentiment("All");
  }

  async function fetchScrapePage(sourceId, page, label) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetchApi(`/api/scrape?source=${sourceId}&page=${page}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        if (page > 1 && /page cannot be greater|no reviews/i.test(data.error || "")) {
          return { stop: true, reviews: [] };
        }
        if (attempt === 2) throw new Error(data.error || `Failed ${label} page ${page}`);
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }

      if (data.reviews?.length) return { reviews: data.reviews, stop: false };
      if (page > 1) return { stop: true, reviews: [] };

      if (attempt === 2) return { reviews: [], stop: false };
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }

    return { reviews: [], stop: false };
  }

  const runScrape = useCallback(async () => {
    setPhase("scraping");
    setReviews([]);
    setAiInsights(null);
    setSourceStatus({});
    setSourceCounts({});
    setScrapeErrors({});
    setTotalCount(0);
    setScrapeStep(0);
    setPage(1);

    const allReviews = [];
    const statuses = {};
    const counts = {};
    const errors = {};
    let step = 0;

    for (const source of SOURCES) {
      const { id, label, pages } = source;
      statuses[label] = "active";
      setSourceStatus({ ...statuses });

      try {
        let sourceCount = 0;

        if (pages) {
          for (let p = 1; p <= pages; p++) {
            const { reviews: batch, stop } = await fetchScrapePage(id, p, label);
            if (stop) break;
            if (!batch.length) {
              if (p === 1 && (id === "appstore" || id === "appstore_rss")) {
                throw new Error(`No reviews returned from ${label}`);
              }
              break;
            }
            allReviews.push(...batch);
            sourceCount += batch.length;
            step += 1;
            setScrapeStep(step);
            setTotalCount(allReviews.length);
          }
        } else {
          const res = await fetchApi(`/api/scrape?source=${id}`);
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error || `Failed to scrape ${label}`);
          allReviews.push(...(data.reviews || []));
          sourceCount = data.count || data.reviews?.length || 0;
          step += 1;
          setScrapeStep(step);
          setTotalCount(allReviews.length);
        }

        statuses[label] = "done";
        counts[label] = sourceCount;
      } catch (err) {
        statuses[label] = "failed";
        counts[label] = 0;
        errors[label] = err.message;
        step += pages || 1;
        setScrapeStep(step);
      }

      setSourceStatus({ ...statuses });
      setSourceCounts({ ...counts });
      setScrapeErrors({ ...errors });
    }

    if (allReviews.length === 0) {
      setPhase("idle");
      alert("All required sources failed. Make sure the API server is running (npm run dev).");
      return;
    }

    const unique = dedupeReviews(allReviews);
    setReviews(unique);
    setPhase("analyzing");
    await runAnalysis(unique);
  }, []);

  function dedupeReviews(list) {
    const seenId = new Set();
    const seenComment = new Set();
    return list.filter((r) => {
      if (seenId.has(r.id)) return false;
      const key = `${r.source}|${r.comment.slice(0, 120).toLowerCase()}`;
      if (seenComment.has(key)) return false;
      seenId.add(r.id);
      seenComment.add(key);
      return true;
    });
  }

  async function runAnalysis(revs) {
    const stats = buildReviewStats(revs);
    const sample = compactReviewsForApi(revs, 400);
    try {
      const res = await fetchApi("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: sample, stats }),
      });
      const data = await res.json();
      if (data.insights) {
        setAiInsights(data.insights);
      } else throw new Error(data.error || "Analysis failed");
    } catch {
      const total = stats.total;
      setAiInsights({
        overview: `We analyzed ${total.toLocaleString()} live Gaana app reviews. Users struggle most with repetitive recommendations, weak search, and difficulty finding fresh music.`,
        discoveryQuestions: [
          { question: "Why do users struggle to discover new music?", answer: "Algorithmic loops, exact-match search, and buried new releases make exploration feel repetitive.", highlights: ["Echo-chamber daily mixes", "Search fails on typos", "New indie artists rarely surfaced"] },
          { question: "What are the most common frustrations with recommendations?", answer: "Autoplay and daily mixes repeat the same tracks; one accidental playlist can poison future suggestions.", highlights: ["Same 15–20 tracks on loop", "No easy reset after bad signals", "Low novelty vs accuracy"] },
          { question: "What listening behaviors are users trying to achieve?", answer: "Find fresh regional and indie music, mood-fit listening, and frictionless exploration without pop-up interruptions.", highlights: ["Discover new artists in their language", "Commute and workout contexts", "Premium users expect smarter discovery"] },
          { question: "What causes users to listen to the same content repeatedly?", answer: "Recommendation bias toward historical plays and trending charts, with weak serendipity controls.", highlights: ["Heavy weight on past listens", "Autoplay defaults to trending", "Language silos limit cross-genre discovery"] },
          { question: "Which user segments experience different discovery challenges?", answer: "Regional-language listeners, premium subscribers, and multi-language users each hit distinct walls.", highlights: ["Telugu/Tamil/Hindi silos", "Paying users expect zero friction", "Kids-content accidents skew families"] },
          { question: "What unmet needs emerge consistently across reviews?", answer: "Smarter search, fresh personalized releases, undo for bad recommendations, and visible community playlists.", highlights: ["Typo-tolerant search", "Personalized new-release surfacing", "Quick 'reset my taste' control"] },
        ],
        sentimentPct: {
          positive: Math.round(stats.positive / total * 100),
          negative: Math.round(stats.negative / total * 100),
          neutral: Math.round(stats.neutral / total * 100),
        },
      });
    }
    setPhase("done");
  }

  const filteredReviews = reviews.filter((r) => {
    if (filterSource !== "All Sources" && r.source !== filterSource) return false;
    if (filterRating !== "All" && r.rating !== parseInt(filterRating, 10)) return false;
    if (filterSentiment !== "All" && r.sentiment !== filterSentiment) return false;
    return true;
  });
  const pagedReviews = filteredReviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const totalScrapeProgress = phase === "analyzing" ? 100 : Math.round((scrapeStep / TOTAL_SCRAPE_STEPS) * 100);

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🎵</div>
          <div>
            <div style={styles.appName}>Gaana Review Analyzer</div>
            <div style={styles.appSub}>The intelligent engine decoding user sentiments.</div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            style={styles.themeBtn}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {dark ? "☀ Light" : "🌙 Dark"}
          </button>
          {phase === "done" && (
            <button type="button" onClick={resetApp} style={{ ...styles.scrapeBtn, background: dark ? "#1e1e2e" : "#ffffff", border: "1px solid rgba(248,113,113,0.35)", color: "#fca5a5" }}>
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {phase === "idle" && (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>🎶</span>
          <div style={styles.emptyTitle}>Ready to Analyze Gaana Reviews</div>
          <button onClick={runScrape} style={{ ...styles.scrapeBtn, margin: "0 auto", fontSize: 15, padding: "12px 28px" }}>
            🔄 Start Scraping
          </button>
        </div>
      )}

      {(phase === "scraping" || phase === "analyzing") && (
        <div style={styles.progressWrap}>
          <div style={styles.progressTitle}>
            {phase === "analyzing" ? "🧠 AI analyzing reviews..." : `⏳ Scraping reviews... ${totalCount.toLocaleString()} collected`}
          </div>
          <div style={styles.progressBar}>
            <div style={styles.progressFill(phase === "analyzing" ? 100 : totalScrapeProgress)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 6 }}>
            {SOURCES.map(({ label }) => (
              <div key={label} style={styles.sourceRow}>
                <div style={styles.sourceStatus(sourceStatus[label] || "pending")} />
                <span style={{ color: styles.mutedText, flex: 1 }}>{label}</span>
                <span style={{ color: styles.faintText, fontSize: 12 }}>
                  {sourceStatus[label] === "done" ? `✓ ${(sourceCounts[label] || 0).toLocaleString()}` : sourceStatus[label] === "failed" ? "✕ Failed" : sourceStatus[label] === "active" ? "..." : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <>
          <div style={{ ...styles.statsRow, marginTop: 24 }}>
            {[
              { label: "Total Reviews", value: reviews.length.toLocaleString(), accent: "#7c3aed" },
              { label: "Positive", value: `${aiInsights?.sentimentPct?.positive ?? 0}%`, accent: "#4ade80" },
              { label: "Negative", value: `${aiInsights?.sentimentPct?.negative ?? 0}%`, accent: "#f87171" },
              { label: "Neutral", value: `${aiInsights?.sentimentPct?.neutral ?? 0}%`, accent: "#94a3b8" },
              { label: "Avg Rating", value: (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) + "★", accent: "#fbbf24" },
              { label: "Sources", value: SOURCES.length, accent: "#38bdf8" },
            ].map((s) => (
              <div key={s.label} style={styles.statCard(s.accent)}>
                <div style={styles.statValue}>{s.value}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>⭐ Rating Distribution</div>
              <RatingDistChart reviews={reviews} styles={styles} />
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>📡 Reviews by Source</div>
              <SourceReviewsChart reviews={reviews} styles={styles} theme={theme} />
            </div>
            <div style={{ ...styles.card, ...styles.fullWidth }}>
              <div style={styles.cardTitle}>📈 Sentiment Trend Over Time</div>
              <SentimentTrendChart reviews={reviews} styles={styles} />
            </div>
          </div>

          <DiscoverySummary insights={aiInsights} styles={styles} theme={theme} />

          <div style={styles.reviewPanel}>
            <div style={{ ...styles.cardTitle, marginBottom: 12 }}>🗂 Review Feed ({filteredReviews.length.toLocaleString()})</div>
            <div style={styles.filterRow}>
              <select style={styles.filterSelect} value={filterSource} onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}>
                <option>All Sources</option>
                {SOURCE_LABELS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select style={styles.filterSelect} value={filterRating} onChange={(e) => { setFilterRating(e.target.value); setPage(1); }}>
                <option value="All">All Ratings</option>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r}★</option>)}
              </select>
              <select style={styles.filterSelect} value={filterSentiment} onChange={(e) => { setFilterSentiment(e.target.value); setPage(1); }}>
                <option value="All">All Sentiments</option>
                <option>positive</option>
                <option>negative</option>
                <option>neutral</option>
              </select>
            </div>

            {pagedReviews.map((r) => (
              <div key={r.id} style={styles.reviewCard}>
                <div style={styles.reviewMeta}>
                  <span style={styles.badge(SOURCE_COLORS[r.source] || "#7c3aed")}>{r.source}</span>
                  <span style={{ color: r.rating >= 4 ? "#4ade80" : r.rating <= 2 ? "#f87171" : "#fbbf24", fontSize: 13 }}>{styles.stars(r.rating)}</span>
                  <span style={styles.badge(r.sentiment === "positive" ? "#4ade80" : r.sentiment === "negative" ? "#f87171" : "#94a3b8")}>{r.sentiment}</span>
                  <span style={{ color: styles.faintText, fontSize: 11, marginLeft: "auto" }}>{r.date}</span>
                </div>
                <div style={{ fontSize: 13, color: styles.mutedText, lineHeight: 1.55 }}>{r.comment}</div>
                <div style={{ fontSize: 11, color: styles.dimText, marginTop: 6 }}>@{r.author}</div>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, alignItems: "center" }}>
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ ...styles.filterSelect, cursor: "pointer", padding: "6px 14px", opacity: page === 1 ? 0.4 : 1 }}>‹</button>
              <span style={{ fontSize: 13, color: styles.faintText }}>Page {page} of {totalPages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ ...styles.filterSelect, cursor: "pointer", padding: "6px 14px", opacity: page === totalPages ? 0.4 : 1 }}>›</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
