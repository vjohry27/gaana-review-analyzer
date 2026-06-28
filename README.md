# 🎵 Gaana Review Analyzer

Monolithic React + Node app that scrapes **7,000+ real Gaana reviews** per run, analyzes them with **Google Gemini** (free) using a **65% research PDF + 35% live reviews** weighting, and visualizes results in a session-only dashboard.

## Ready to run — you only need:

```env
GEMINI_API_KEY=AIza...   # free from https://aistudio.google.com/apikey
```

No Play Store keys. No App Store keys. No database.

Research PDF: `data/Gaana User Review Analysis Research.pdf` (bundled with the project).

---

## Quick start

```bash
npm install
copy .env.example .env.local   # paste GEMINI_API_KEY
npm run dev
```

→ http://localhost:5173 → **Start Scraping**

Full steps: **[QUICKSTART.md](./QUICKSTART.md)**

---

## What each run collects

| Source | ~Reviews | API key? |
|--------|----------|----------|
| Play Store (newest, IN) | ~2,700 | No |
| Play Store (top-rated) | ~600 unique | No |
| Play Store (most helpful) | ~800 unique | No |
| Play Store (US) | ~2,000 unique | No |
| Play Store (Hindi) | ~700 unique | No |
| App Store (10 pages) | ~700 | No |
| App Store RSS (10 pages) | ~650 | No |

After deduplication: **7,000–8,500 reviews** typical.

---

## AI Discovery Summary

After scraping, Gemini produces a readable Q&A-style summary answering six discovery questions:

1. Why do users struggle to discover new music?
2. What are the most common frustrations with recommendations?
3. What listening behaviors are users trying to achieve?
4. What causes users to listen to the same content repeatedly?
5. Which user segments experience different discovery challenges?
6. What unmet needs emerge consistently across reviews?

**Weighting:** 65% internal research PDF · 35% live scraped reviews (scraping is mandatory).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | API + frontend (use this) |
| `npm run test:scrape:full` | Verify 7k+ reviews can be scraped |
| `npm run build` | Production frontend build |

---

## Architecture

```
React UI  →  /api/scrape  →  lib/scrapers/  →  Play Store, App Store
           /api/analyze  →  Gemini + research PDF (65%) + reviews (35%)
```

---

## Deployment (Vercel)

1. Push to GitHub (include `data/` PDF folder)
2. Import on [vercel.com](https://vercel.com)
3. Set `GEMINI_API_KEY` in project Environment Variables
4. Deploy
