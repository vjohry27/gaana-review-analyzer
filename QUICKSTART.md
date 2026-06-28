# ⚡ Quick Start — Gaana Review Analyzer

**You only need one thing:** a free Google Gemini API key.

---

## Step 1: Get Gemini API key (2 min)

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with Google (no credit card required)
3. Click **Create API key**
4. Copy the key (starts with `AIza...`)

---

## Step 2: Install (1 min)

```bash
cd "Gaana App reviewer"
npm install
```

---

## Step 3: Configure (30 sec)

```bash
copy .env.example .env.local
```

Edit `.env.local` and paste your key:

```env
GEMINI_API_KEY=AIzaSy...your_key_here
```

That's the **only** credential needed. Scraping uses public store APIs (no Play Store / App Store keys).

Place the research PDF at `data/Gaana User Review Analysis Research.pdf` (included). AI analysis weights this PDF at **65%** and live scraped reviews at **35%**.

---

## Step 4: Run

```bash
npm run dev
```

Opens **http://localhost:5173**. Click **Start Scraping** on the home page.

Each run collects **7,000+ real reviews** from seven sources, then generates a discovery-focused AI summary.

---

## Verify scrapers work (optional)

```bash
npm run test:scrape:full
```

Should print `unique: 7000+` when successful.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "All required sources failed" | Run `npm run dev` and wait for API + Vite to both start |
| AI shows fallback text | Add `GEMINI_API_KEY` to `.env.local`, restart |
| Port in use | `npm run dev:client -- --port 3000` |

See **README.md** for architecture and deployment.
