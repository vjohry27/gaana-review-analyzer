# 🎯 Gaana Review Analyzer — Complete Development Context for Cursor

This file provides comprehensive documentation for developers using Cursor IDE to work on or extend the Gaana Review Analyzer codebase.

---

## 📚 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Directory Structure](#directory-structure)
4. [Core Components & Data Flow](#core-components--data-flow)
5. [Key Functions & Modules](#key-functions--modules)
6. [State Management](#state-management)
7. [Styling System](#styling-system)
8. [API Integration](#api-integration)
9. [How to Extend](#how-to-extend)
10. [Common Modifications](#common-modifications)
11. [Debugging Guide](#debugging-guide)

---

## Project Overview

**Name:** Gaana Review Analyzer  
**Type:** React + Vite + Recharts SPA (Single Page Application)  
**Purpose:** Scrape, analyze, and visualize user reviews of the Gaana music app using AI  
**Data Scope:** ~10,000 reviews from 7 sources over 12 months  
**Deployment:** Session-only (no database, no persistence)  
**UI Pattern:** Dashboard with charts, review feed, AI chatbot, real-time scraping progress  

### Core Problem Solved
Users want to understand what Gaana app users think: What do they love? What frustrates them? What features are requested? This app provides AI-generated answers with supporting data visualizations.

### Why This Architecture?
- **No database:** Simpler deployment, faster iteration, perfect for certification projects
- **Session-only:** Privacy-first, no data tracking, fresh data on every run
- **React + Vite:** Fast hot-reload development, minimal build overhead
- **Claude API:** State-of-the-art LLM analysis, free tier available
- **Recharts:** Production-ready charts with minimal configuration

---

## Architecture & Tech Stack

### Frontend Stack
```
React 18.2.0
  ├── State Management: useState, useRef, useCallback
  ├── Visualization: Recharts 2.10.3
  │   ├── BarChart (rating distribution)
  │   ├── PieChart (source breakdown)
  │   └── LineChart (sentiment trends)
  └── Build Tool: Vite 5.0.8
```

### Backend/API
```
Anthropic Claude API (claude-sonnet-4-6)
  ├── Purpose: LLM analysis of reviews
  ├── Endpoint: https://api.anthropic.com/v1/messages
  ├── Auth: API key in .env.local
  └── Usage: Analysis + Chatbot
```

### Styling Approach
```
Inline CSS Objects (No external CSS files)
  ├── Defined in 'S' object (line ~80)
  ├── Theme: Dark mode with purple/pink gradients
  ├── Colors: Hex-based with rgba for transparency
  └── Responsive: CSS Grid, Flexbox, media-query-friendly
```

### Data Sources (Simulated)
```
Mock Review Generator
  ├── SOURCES: ["Play Store", "Play Store (Rated)", "Play Store (Hindi)", "App Store", "App Store RSS"]
  ├── COMMENT BANKS: POSITIVE_COMMENTS, NEGATIVE_COMMENTS, NEUTRAL_COMMENTS
  ├── WORD CLOUD: WORD_CLOUD_WORDS with sentiment tags
  └── Distribution: 40% positive, 30% negative, 30% neutral
```

---

## Directory Structure

```
gaana-review-analyzer/
│
├── src/
│   ├── App.jsx                    # Main React component (1,200+ lines, all-in-one)
│   │   ├── State hooks (useState, useRef)
│   │   ├── Mock data generators
│   │   ├── Helper components (WordCloud, Charts)
│   │   ├── AI analysis function
│   │   ├── Chat handler
│   │   └── Render logic
│   │
│   └── main.jsx                   # React entry point (simple, no logic)
│       ├── Import React & ReactDOM
│       ├── Import App component
│       └── Render to #root
│
├── index.html                     # HTML template
│   ├── <meta> tags for viewport
│   ├── Global <style> for reset
│   └── <script src="src/main.jsx">
│
├── vite.config.js                 # Vite configuration
│   ├── React plugin enabled
│   ├── Dev server on :5173
│   └── Auto-open on startup
│
├── package.json                   # Dependencies manifest
│   ├── react, react-dom
│   ├── recharts
│   ├── vite, @vitejs/plugin-react
│   └── Scripts: dev, build, preview
│
├── .env.example                   # Template (NO secrets here)
├── .env.local                     # YOUR API KEY (git-ignored, not in repo)
├── .gitignore                     # Git rules (ignores .env.local)
│
├── README.md                      # Full documentation
├── QUICKSTART.md                  # 3-minute setup guide
└── CURSOR_CONTEXT.md              # This file
```

---

## Core Components & Data Flow

### 1. **App Component** (src/App.jsx)
The entire application is a single React component. Here's the structure:

```jsx
export default function App() {
  // ══════════════════════════════════════
  // 1. STATE MANAGEMENT
  // ══════════════════════════════════════
  const [phase, setPhase] = useState("idle");           // idle | scraping | analyzing | done
  const [sourceStatus, setSourceStatus] = useState({});  // { "Play Store": "done", ... }
  const [sourceCounts, setSourceCounts] = useState({});  // { "Play Store": 3000, ... }
  const [reviews, setReviews] = useState([]);            // Array of review objects
  const [aiInsights, setAiInsights] = useState(null);    // AI analysis result
  const [totalCount, setTotalCount] = useState(0);       // Running count during scrape
  const [scrapedAt, setScrapedAt] = useState(null);      // Timestamp of last scrape
  
  // Review feed filters
  const [page, setPage] = useState(1);                   // Current page number
  const [filterSource, setFilterSource] = useState("All");      // Filter by source
  const [filterRating, setFilterRating] = useState("All");      // Filter by 1-5★
  const [filterSentiment, setFilterSentiment] = useState("All"); // positive/negative/neutral
  const [filterKeyword, setFilterKeyword] = useState("");       // Text search
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);      // Is chat drawer open?
  const [chatMessages, setChatMessages] = useState([...]); // Array of {role, content}
  const [chatInput, setChatInput] = useState("");        // User's typed message
  const [chatLoading, setChatLoading] = useState(false); // Is AI thinking?
  const chatEndRef = useRef(null);                       // Scroll to bottom of chat

  // ══════════════════════════════════════
  // 2. PHASE FLOW
  // ══════════════════════════════════════
  // idle → (user clicks) → scraping → analyzing → done
  // Each phase renders different UI
  
  // ══════════════════════════════════════
  // 3. KEY FUNCTIONS
  // ══════════════════════════════════════
  const runScrape = useCallback(async () => { ... });   // Orchestrates scraping
  const runAnalysis = async (revs) => { ... };          // Sends to Claude API
  const sendChat = async () => { ... };                 // Handles chatbot messages
  
  // ══════════════════════════════════════
  // 4. RENDER
  // ══════════════════════════════════════
  // Header → Session banner → Phase-specific UI → Chat FAB/Drawer
}
```

### 2. **Data Flow Diagram**

```
USER ACTION
    ↓
Click "Scrape & Analyze"
    ↓
runScrape() called
    ├─ Reset all state
    ├─ Set phase="scraping"
    ├─ Loop through SOURCES
    │  ├─ Update sourceStatus[source]="active"
    │  ├─ Simulate delay (600-1400ms per source)
    │  ├─ Generate mock reviews for that source
    │  ├─ Update sourceCounts[source], totalCount
    │  └─ Update sourceStatus[source]="done" or "failed"
    ├─ Set phase="analyzing"
    └─ Call runAnalysis(allReviews)
         ├─ Sample 300 reviews
         ├─ Build prompt with sentiment breakdown
         ├─ Fetch from Claude API
         ├─ Parse JSON response
         ├─ Set aiInsights state
         └─ Set phase="done"
    ↓
DASHBOARD RENDERS with:
├─ Stat cards (total, %, avg rating)
├─ Charts (rating dist, source pie, sentiment line)
├─ AI insight cards (loves, pain points, suggestions, bugs)
├─ Word cloud
├─ Review feed with filters
└─ Chat FAB

USER INTERACTIONS:
├─ Filter reviews → Filter state updated → Render filtered reviews
├─ Click chat → chatOpen=true → Chat drawer slides in
├─ Type message → sendChat() → Claude API → chatMessages updated
└─ Pagination → page state updated → Different reviews rendered
```

### 3. **Review Object Structure**

Every scraped review is an object:

```javascript
{
  id: "r_1234",                    // Unique identifier
  source: "Play Store",             // Where it came from
  author: "user_45678",             // Username (anonymized in mock data)
  rating: 4,                        // 1-5 stars
  comment: "Great app, but crashes sometimes",  // Review text
  date: "2024-08-15",               // YYYY-MM-DD format
  sentiment: "neutral"              // positive | negative | neutral (AI-assigned)
}
```

---

## Key Functions & Modules

### Function 1: `runScrape()` — Orchestrates Scraping

**Location:** App.jsx, ~line 300  
**Trigger:** User clicks "🔄 Scrape & Analyze"  
**Duration:** ~5-7 seconds (simulated)

```javascript
const runScrape = useCallback(async () => {
  // 1. Reset state
  setPhase("scraping");
  setReviews([]);
  setAiInsights(null);
  setSourceStatus({});
  setSourceCounts({});
  
  // 2. Loop through each source
  for (const source of SOURCES) {
    statuses[source] = "active";
    setSourceStatus({ ...statuses });
    
    // 3. Simulate delay
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
    
    // 4. Generate mock reviews
    const target = SOURCE_TARGETS[source];  // e.g., 3000 for Play Store
    const batch = generateMockReviews(target).slice(0, target);
    batch.forEach(r => { r.source = source; });
    
    // 5. Update counts
    allReviews.push(...batch);
    statuses[source] = "done" or "failed";
    counts[source] = batch.length;
    setTotalCount(allReviews.length);
  }
  
  // 6. Trigger analysis
  setPhase("analyzing");
  await runAnalysis(allReviews);
}, []);
```

**Key Variables:**
- `SOURCE_TARGETS` — How many reviews per source (defined at top)
- `SOURCES` — Array of source names
- `sourceStatus` — Maps source name to "active"|"done"|"failed"|"pending"
- `allReviews` — Accumulates all reviews across all sources

**Testing:** Add `console.log(allReviews)` after scraping to see the data.

---

### Function 2: `runAnalysis(reviews)` — AI Analysis

**Location:** App.jsx, ~line 370  
**Input:** Array of review objects  
**Output:** Sets aiInsights state with JSON structure  
**API:** Claude Sonnet 4.6 via Anthropic API

```javascript
const runAnalysis = async (revs) => {
  // 1. Sample reviews and filter by sentiment
  const sample = revs.slice(0, 300);
  const positiveRevs = sample
    .filter(r => r.sentiment === "positive")
    .slice(0, 80)
    .map(r => r.comment)
    .join("\n");
  
  // 2. Build prompt (tells Claude what to analyze)
  const prompt = `You are an expert product analyst. Analyze these ${total} user reviews...`;
  
  // 3. Call Claude API
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  
  // 4. Parse response (Claude returns JSON)
  const data = await response.json();
  const text = data.content[0].text;
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  
  // 5. Update state
  setAiInsights(parsed);
  setPhase("done");
};
```

**AI Response Structure:**
```javascript
{
  summary: "Gaana has a mixed reception...",
  loves: ["Massive Bollywood library", "Offline downloads", ...],
  painPoints: ["Frequent crashes", "Excessive ads", ...],
  suggestions: ["Reduce ads", "Fix crashes", ...],
  bugs: ["App crashes when switching songs", ...],
  sentimentPct: { positive: 40, negative: 30, neutral: 30 }
}
```

**Error Handling:** If API fails, shows fallback insights (hardcoded good responses).

---

### Function 3: `sendChat()` — Chatbot Handler

**Location:** App.jsx, ~line 420  
**Trigger:** User types message + clicks Send  
**Behavior:** Streams AI response, maintains chat history

```javascript
const sendChat = async () => {
  if (!chatInput.trim() || chatLoading) return;
  
  const userMsg = chatInput.trim();
  setChatInput("");
  
  // 1. Add user message to chat
  setChatMessages(m => [...m, { role: "user", content: userMsg }]);
  setChatLoading(true);
  
  // 2. Build context (last 200 reviews + AI insights)
  const context = reviews.slice(0, 200)
    .map(r => `[${r.source}][${r.rating}★] ${r.comment}`)
    .join("\n");
  
  // 3. Call Claude with full context
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        ...chatMessages.slice(-6),  // Last 6 messages for context
        { role: "user", content: userMsg }
      ]
    })
  });
  
  // 4. Add AI response to chat
  const data = await response.json();
  const reply = data.content[0].text;
  setChatMessages(m => [...m, { role: "assistant", content: reply }]);
  setChatLoading(false);
};
```

**Chat Memory:** Keeps last 6 messages for context (prevents token overflow).

---

### Function 4: `generateMockReviews(count)` — Mock Data

**Location:** App.jsx, ~line 45  
**Input:** Number of reviews to generate  
**Output:** Array of review objects with realistic data

```javascript
function generateMockReviews(count) {
  const reviews = [];
  
  // 1. Generate dates spanning last 12 months
  const oneYearAgo = new Date(now.getFullYear() - 1, ...);
  
  // 2. For each review, randomly pick sentiment
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    
    if (rand < 0.38) {
      // 38% positive reviews
      sentiment = "positive";
      rating = Math.random() < 0.6 ? 5 : 4;
      comment = POSITIVE_COMMENTS[Math.random() * POSITIVE_COMMENTS.length];
    } else if (rand < 0.72) {
      // 34% negative reviews
      sentiment = "negative";
      rating = Math.random() < 0.6 ? 1 : 2;
      comment = NEGATIVE_COMMENTS[...];
    } else {
      // 28% neutral reviews
      sentiment = "neutral";
      rating = 3;
      comment = NEUTRAL_COMMENTS[...];
    }
    
    // 3. Random date in last 12 months
    const date = new Date(oneYearAgo + Math.random() * (now - oneYearAgo));
    
    // 4. Push to reviews array
    reviews.push({ id, source, author, rating, comment, date, sentiment });
  }
  
  return reviews.sort(() => Math.random() - 0.5);  // Shuffle
}
```

**Comment Banks:**
- `POSITIVE_COMMENTS` — ~15 sample positive reviews
- `NEGATIVE_COMMENTS` — ~15 sample negative reviews
- `NEUTRAL_COMMENTS` — ~8 sample neutral reviews

To add more realistic reviews, expand these arrays.

---

### Helper Component 1: `WordCloud()`

**Location:** App.jsx, ~line 140  
**Purpose:** Display most mentioned words with size/color encoding

```javascript
function WordCloud() {
  const maxVal = Math.max(...WORD_CLOUD_WORDS.map(w => w.value));
  
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
      {WORD_CLOUD_WORDS.map(w => {
        // Size based on frequency
        const size = 11 + (w.value / maxVal) * 26;
        // Color based on sentiment
        const color = w.sentiment === "positive" ? "#4ade80" : 
                      w.sentiment === "negative" ? "#f87171" : "#94a3b8";
        return <span key={w.text} style={{ fontSize: size, color }}>{w.text}</span>;
      })}
    </div>
  );
}
```

**Data Source:** `WORD_CLOUD_WORDS` array (defined at top, line ~35)

---

### Helper Component 2: Charts (Recharts)

**Location:** App.jsx, ~line 180+  

**RatingDistChart:** Bar chart showing 1★–5★ distribution
```javascript
function RatingDistChart({ reviews }) {
  const data = [1,2,3,4,5].map(r => ({
    rating: `${r}★`,
    count: reviews.filter(rv => rv.rating === r).length
  }));
  return <BarChart data={data}><Bar dataKey="count" /></BarChart>;
}
```

**SourcePieChart:** Pie chart showing reviews per source
```javascript
function SourcePieChart({ reviews }) {
  const data = SOURCES.map(s => ({
    name: s,
    value: reviews.filter(r => r.source === s).length
  }));
  return <PieChart><Pie data={data} dataKey="value" /></PieChart>;
}
```

**SentimentTrendChart:** Line chart showing positive/negative/neutral over 12 months
```javascript
function SentimentTrendChart({ reviews }) {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthRevs = reviews.filter(r => r.date.startsWith(d.toISOString()));
    months.push({
      month: d.toLocaleString("default", { month: "short" }),
      Positive: monthRevs.filter(r => r.sentiment === "positive").length,
      Negative: monthRevs.filter(r => r.sentiment === "negative").length,
      Neutral: monthRevs.filter(r => r.sentiment === "neutral").length
    });
  }
  return <LineChart data={months}><Line dataKey="Positive" /></LineChart>;
}
```

---

## State Management

### State Variables Overview

| Variable | Type | Purpose | Updated By |
|---|---|---|---|
| `phase` | string | App lifecycle: idle → scraping → analyzing → done | `setPhase()` |
| `sourceStatus` | object | Per-source scraping status (active/done/failed/pending) | Loop in `runScrape()` |
| `sourceCounts` | object | Review count per source | Loop in `runScrape()` |
| `reviews` | array | All scraped reviews | `setReviews()` in `runScrape()` |
| `aiInsights` | object | AI analysis result (loves, pain points, etc.) | `setAiInsights()` in `runAnalysis()` |
| `totalCount` | number | Running count during scrape | `setTotalCount()` in loop |
| `scrapedAt` | string | Timestamp of last scrape | `setScrapedAt()` after analysis |
| `page` | number | Current page in review feed | Pagination buttons |
| `filterSource` | string | Selected source filter | Review feed dropdown |
| `filterRating` | string | Selected rating filter (1-5★) | Review feed dropdown |
| `filterSentiment` | string | Selected sentiment filter | Review feed dropdown |
| `filterKeyword` | string | Text search query | Review feed input |
| `chatOpen` | boolean | Is chat drawer visible? | Chat FAB button |
| `chatMessages` | array | Chat history [{role, content}] | `setChatMessages()` |
| `chatInput` | string | User's typed message | Chat input field |
| `chatLoading` | boolean | Is AI thinking? | `setChatLoading()` in `sendChat()` |

### State Reset Pattern

When user clicks "Scrape & Analyze", all old data is cleared:

```javascript
setPhase("scraping");
setReviews([]);
setAiInsights(null);
setSourceStatus({});
setSourceCounts({});
setTotalCount(0);
setPage(1);
```

This ensures each scrape starts fresh (no leftover data from previous run).

---

## Styling System

### Design Pattern: Inline CSS Objects

All styles defined in the `S` object (line ~80 in App.jsx):

```javascript
const S = {
  app: { minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", ... },
  header: { background: "linear-gradient(...)", padding: "20px 32px", ... },
  card: { background: "#111118", border: "1px solid rgba(...)", ... },
  ...
};
```

**Why inline styles?**
- No external CSS files to manage
- Styles live next to JSX (co-located)
- Easy to use state for dynamic styling
- Smaller bundle size

### Color Palette

```javascript
// Background colors
#0a0a0f  — App background (darkest)
#111118  — Card background
#1a1a2e  — Lighter backgrounds
#0f0f1a  — Input backgrounds

// Text colors
#e2e8f0  — Primary text (light)
#cbd5e1  — Secondary text
#94a3b8  — Tertiary text (muted)
#64748b  — Quaternary text (very muted)
#475569  — Disabled/placeholder text

// Accent colors
#7c3aed  — Purple (primary accent)
#ec4899  — Pink (secondary accent)
#a78bfa  — Light purple

// Sentiment colors
#4ade80  — Green (positive)
#f87171  — Red (negative)
#94a3b8  — Gray (neutral)
#fbbf24  — Yellow (warnings/info)
```

### Responsive Design Approach

Uses CSS Grid and Flexbox:

```javascript
// Grid layout (auto-fits columns)
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: 20
};

// Full-width on small screens
const fullWidth = {
  gridColumn: "1 / -1"  // Spans all columns
};

// Flex for horizontal layouts
const flexRow = {
  display: "flex",
  alignItems: "center",
  gap: 8
};
```

Media queries handled via inline styles (no CSS media queries since using inline styles).

### Component Styling Patterns

**Pattern 1: Function Returning Styles**
```javascript
const badge = (color) => ({
  background: color + "20",  // 20% opacity
  color: color,
  fontSize: 10,
  padding: "2px 8px"
});

// Usage:
<span style={S.badge(SOURCE_COLORS[r.source])} />
```

**Pattern 2: Conditional Styles**
```javascript
<button
  style={{
    ...S.scrapeBtn,
    opacity: (phase === "scraping") ? 0.6 : 1
  }}
/>
```

**Pattern 3: Gradient Backgrounds**
```javascript
const insightCard = (bg, border) => ({
  background: bg,              // e.g., "rgba(74,222,128,0.06)"
  border: `1px solid ${border}`, // e.g., "rgba(74,222,128,0.15)"
  borderRadius: 12,
  padding: 16
});
```

---

## API Integration

### Anthropic API Configuration

**Endpoint:** `https://api.anthropic.com/v1/messages`  
**Model:** `claude-sonnet-4-6` (Latest, fastest)  
**Auth:** Bearer token (API key)  
**Rate:** Free tier allows ~5000 requests/month  

### API Call Pattern

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // Note: No Authorization header needed in browser (handled by Anthropic)
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,  // Response length limit
    messages: [
      { role: "user", content: "Your prompt here" }
    ]
  })
});

const data = await response.json();
const text = data.content[0].text;  // Response text
```

### Two API Uses

**1. Analysis (runAnalysis function)**
```javascript
// Sends sample reviews + sentiment breakdown
// Expects JSON response with: summary, loves, painPoints, suggestions, bugs, sentimentPct
// Used once after scraping completes
```

**2. Chatbot (sendChat function)**
```javascript
// Sends user question + review context + chat history
// Expects text response (conversational)
// Used multiple times during session
```

### Error Handling

If API fails, app shows fallback response:

```javascript
try {
  const response = await fetch(...);
  const data = await response.json();
  // Process response
} catch (e) {
  // Show hardcoded fallback
  setAiInsights({
    summary: "Gaana has a mixed reception...",
    loves: [...],
    painPoints: [...],
    // ... etc
  });
}
```

Fallback data defined at line ~400 (in `runAnalysis` function).

---

## How to Extend

### Extension 1: Add a New Review Source

1. **Add to SOURCES array** (line ~25):
   ```javascript
   const SOURCES = [..., "YouTube Comments"];
   ```

2. **Add target count** (line ~27):
   ```javascript
   const SOURCE_TARGETS = { ..., "YouTube Comments": 800 };
   ```

3. **Add color** (line ~28):
   ```javascript
   const SOURCE_COLORS = { ..., "YouTube Comments": "#ff0000" };
   ```

That's it! The scraping loop will automatically include it.

---

### Extension 2: Add More AI Insights

Modify the AI prompt in `runAnalysis()`:

```javascript
const prompt = `...existing text...
ALSO INCLUDE:
- Key statistics about review frequency per author
- Most cited feature requests
- Time-based sentiment changes (improving or declining?)
- Comparison with industry benchmarks
`;
```

Then update the response structure:

```javascript
const parsed = JSON.parse(clean);
// Now parsed will have new fields if Claude returns them
setAiInsights(parsed);
```

---

### Extension 3: Add a New Chart

1. **Create chart component**:
   ```javascript
   function MyNewChart({ reviews }) {
     const data = reviews.map(r => ({...}));
     return <ResponsiveContainer><LineChart data={data}>...</LineChart>;
   }
   ```

2. **Add to dashboard grid**:
   ```javascript
   <div style={S.card}>
     <div style={S.cardTitle}>📊 My New Chart</div>
     <MyNewChart reviews={reviews} />
   </div>
   ```

---

### Extension 4: Add Export Formats

Currently exports CSV. To add JSON:

```javascript
const exportJSON = () => {
  const blob = new Blob([JSON.stringify(reviews, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gaana_reviews.json";
  a.click();
};

// Add button:
<button onClick={exportJSON} style={S.scrapeBtn}>📥 Export JSON</button>
```

---

### Extension 5: Persist Data to localStorage

To save data across sessions (violates current design, but possible):

```javascript
// After scraping completes
useEffect(() => {
  if (phase === "done" && reviews.length > 0) {
    localStorage.setItem("gaana_reviews", JSON.stringify(reviews));
    localStorage.setItem("gaana_insights", JSON.stringify(aiInsights));
  }
}, [phase, reviews, aiInsights]);

// On app load
useEffect(() => {
  const saved = localStorage.getItem("gaana_reviews");
  if (saved) {
    setReviews(JSON.parse(saved));
    setPhase("done");
  }
}, []);
```

---

## Common Modifications

### Modification 1: Change Theme Colors

All colors in the `S` object. Find & replace:

```javascript
// Old purple
"#7c3aed" → "#your-color"

// Old pink
"#ec4899" → "#your-color"

// Old dark background
"#0a0a0f" → "#your-color"
```

Example: To switch to a blue theme:
```javascript
const S = {
  header: { background: "linear-gradient(135deg, #0f0f1a, #0a1628)", ... },
  scrapeBtn: { background: "linear-gradient(135deg, #3b82f6, #1e40af)", ... },
  // etc
};
```

---

### Modification 2: Change Sentiment Distribution

Mock data uses 40% positive, 30% negative, 30% neutral. To change:

```javascript
function generateMockReviews(count) {
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    
    // NEW DISTRIBUTION: 50% positive, 25% negative, 25% neutral
    if (rand < 0.50) {  // Changed from 0.38
      sentiment = "positive";
      // ...
    } else if (rand < 0.75) {  // Changed from 0.72
      sentiment = "negative";
      // ...
    } else {
      sentiment = "neutral";
      // ...
    }
  }
}
```

---

### Modification 3: Change Scraping Speed

Delay between sources is simulated. To make faster/slower:

```javascript
// Current: 600-1400ms per source
await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

// Faster: 200-600ms per source
await new Promise(r => setTimeout(r, 200 + Math.random() * 400));

// Slower: 1000-2000ms per source
await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
```

---

### Modification 4: Change Review Count Target

Edit `SOURCE_TARGETS`:

```javascript
const SOURCE_TARGETS = {
  "Play Store": 5000,      // Was 3000
  "App Store": 3000,       // Was 2000
  "Play Store (Hindi)": 500,
  // etc
};
```

Total will auto-scale in `generateMockReviews()`.

---

### Modification 5: Change Page Size in Review Feed

Current: 15 reviews per page

```javascript
const PAGE_SIZE = 15;  // Change this number

// Or make dynamic based on window size:
const PAGE_SIZE = window.innerWidth < 768 ? 10 : 15;
```

---

## Debugging Guide

### 1. Enable Console Logging

Add `console.log()` in key functions:

```javascript
const runScrape = async () => {
  console.log("Scraping started");
  for (const source of SOURCES) {
    console.log(`Processing ${source}...`);
    // ... scraping code ...
    console.log(`${source} complete:`, batch.length);
  }
};

const runAnalysis = async (revs) => {
  console.log("Analyzing", revs.length, "reviews");
  console.log("Sentiment breakdown:", { positive: pos, negative: neg, neutral: neu });
  // ... analysis code ...
};
```

Then check **Browser DevTools** (F12 → Console tab) to see logs.

---

### 2. Inspect State

React DevTools extension shows all state changes:

1. Install **React Developer Tools** browser extension
2. Open app
3. Open DevTools (F12)
4. Go to **Components** tab
5. Select `<App>` component
6. Watch state updates in real-time

---

### 3. Debug API Calls

Add network monitoring:

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  // ... config ...
});

console.log("API Response:", response);
const data = await response.json();
console.log("API Data:", data);
console.log("API Text:", data.content[0].text);
```

Check **DevTools → Network tab** to see:
- Request headers
- Request body
- Response status (200 = success, 401 = auth error)
- Response body

---

### 4. Debug Rendering Issues

If charts don't show:

```javascript
const RatingDistChart = ({ reviews }) => {
  console.log("RatingDistChart rendered with", reviews.length, "reviews");
  const data = [1,2,3,4,5].map(r => ({
    rating: `${r}★`,
    count: reviews.filter(rv => rv.rating === r).length
  }));
  console.log("Chart data:", data);
  return <BarChart data={data}>...</BarChart>;
};
```

If still not showing, check:
- Does `<ResponsiveContainer>` have explicit width/height?
- Is the component inside a visible (non-hidden) parent?
- Check console for Recharts errors

---

### 5. Debug Filters

If filters not working:

```javascript
const filteredReviews = reviews.filter(r => {
  console.log("Checking review:", r);
  if (filterSource !== "All" && r.source !== filterSource) {
    console.log("Failed source filter");
    return false;
  }
  // ... other filters ...
  return true;
});
console.log("Filtered result:", filteredReviews.length);
```

---

### 6. Debug Chat

If chatbot not responding:

```javascript
const sendChat = async () => {
  console.log("User message:", chatInput);
  console.log("Chat history:", chatMessages);
  console.log("Review context:", reviews.slice(0, 5)); // First 5 reviews
  
  const response = await fetch(...);
  console.log("Chat API response:", response);
  const data = await response.json();
  console.log("Chat AI response:", data.content[0].text);
};
```

Common issues:
- API key missing → Check `.env.local` file
- API key invalid → Get new one from console.anthropic.com
- No reviews scraped → Can't chat without data (expected)
- Rate limited → Wait 1 hour before next request

---

## Code Conventions Used

### Naming
- **Components:** PascalCase (`WordCloud`, `RatingDistChart`)
- **Functions:** camelCase (`runScrape`, `sendChat`)
- **Constants:** SCREAMING_SNAKE_CASE (`SOURCES`, `SOURCE_TARGETS`)
- **State setters:** `set + StateName` (`setPhase`, `setReviews`)

### JSX Patterns
- All inline styles (no CSS classes)
- Ternary for conditionals: `phase === "done" ? <div/> : null`
- Shorthand for objects: `{ ...S.card, ...S.fullWidth }`

### Function Organization
- Hooks (useState, useRef, useCallback) at top
- Helper components in middle
- Main render at bottom

### Comments
- Comment major sections with `// ─── SECTION NAME ───`
- Use comment blocks for complex logic
- Minimal inline comments (code should be self-explanatory)

---

## Performance Considerations

### Current Optimizations
- ✅ `useCallback` for `runScrape` (prevents unnecessary re-renders)
- ✅ `useRef` for chat scroll (direct DOM manipulation, doesn't re-render)
- ✅ `.slice()` to limit review context sent to Claude (saves tokens/time)
- ✅ No external dependencies besides React & Recharts (fast load)

### Potential Improvements
- Memoize chart components with `React.memo()` to prevent re-renders on non-data changes
- Virtualize long review lists (render only visible rows) using `react-window`
- Cache API responses (analyze same reviews multiple times without re-calling API)
- Debounce filter inputs (don't re-filter on every keystroke)

---

## Deployment Checklist

- [ ] `.env.local` file created with valid `VITE_ANTHROPIC_API_KEY`
- [ ] `npm install` completed (check `node_modules/` exists)
- [ ] `npm run dev` starts without errors
- [ ] Click "Scrape & Analyze" → progress bar appears
- [ ] After ~10 seconds, dashboard appears with data
- [ ] Filters work (try filtering by source)
- [ ] Chat button opens drawer
- [ ] Type a message in chat → AI responds
- [ ] Export CSV button works
- [ ] No console errors (F12 → Console)

---

## Final Notes for Cursor Users

### How to Use This File in Cursor
1. Open `CURSOR_CONTEXT.md` in Cursor
2. Highlight sections relevant to your task
3. Ask Cursor to modify code based on this context
4. Cursor will understand the full architecture

### Example Cursor Prompts
- *"Based on CURSOR_CONTEXT.md, add a new source called 'YouTube Comments'"*
- *"Following the styling patterns in this file, create a new chart showing review frequency per day"*
- *"Use the AI integration pattern documented here to add a new analysis type"*
- *"Debug why the word cloud isn't rendering. Use the debugging guide."*

### When to Refer to This File
- **Extending features:** Before modifying, understand the data flow
- **Bug fixing:** Debugging section has step-by-step procedures
- **Style changes:** Styling system section explains the pattern
- **API issues:** API integration section covers common problems
- **New features:** How to extend section has templates for common changes

---

## Summary

This is a **single-file React app** designed for clarity and ease of modification:

- **~1,200 lines of code** in `src/App.jsx`
- **No complex state management** (just useState & useRef)
- **All styles inline** (no CSS files)
- **Mock data generation** (simulated scraping)
- **Real AI integration** (Claude API)
- **Beautiful dark UI** (gradient theme)
- **Session-only data** (no database)

Perfect for:
✅ Learning React patterns  
✅ Understanding AI integration  
✅ Building data visualization dashboards  
✅ Certification projects  
✅ Portfolio projects  
✅ Quick prototypes  

Ready to extend with:
✅ Real scrapers (Playwright backend)  
✅ Database persistence  
✅ User authentication  
✅ Multi-user analytics  
✅ Export to more formats  
✅ Advanced filtering  

---

**Happy coding! 🎵 Use Cursor's AI features to extend this app further.**