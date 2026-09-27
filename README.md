# Gaana Review Analyzer

An end-to-end AI-powered product intelligence and customer feedback analytics platform built for the **Gaana** music streaming application. It extracts, cleans, analyzes, and synthesizes thousands of user reviews across the Google Play Store and Apple App Store to surface real-time user sentiment, recurring software bugs, UX friction points, and actionable product recommendations.

---

## Highlights

* **Automated Multi-Source Scraping**: Pulls live user reviews across both Google Play Store and Apple App Store with support for localized Hindi reviews, regional US feeds, top helpful reviews, and granular rating tiers.


* **Sentiment & Lexical Analytics**: Analyzes feedback distribution into positive, neutral, and negative sentiment tiers alongside real-time word cloud frequency and keyword density extraction.


* **AI Product Intelligence**: Employs Large Language Models to transform unstructured user feedback into structured product insights, executive takeaways, feature requests, and bug severity reports.


* **Context-Grounded Research Assistant**: Features an interactive conversational discovery interface grounded in live scrape results and pre-compiled UX research data (`Gaana User Review Analysis Research.pdf`).


* **Hybrid Deployment Architecture**: Runs locally with a unified Node.js dev server or deploys directly to Vercel via serverless API routes (`/api/*`).



---

## System Architecture

```text
                     +---------------------------------------+
                     |         React + Vite Frontend         |
                     |  (Interactive Dashboard & Chat UI)    |
                     +-------------------+-------------------+
                                         |
                                  REST API Calls
                                         |
                     +-------------------v-------------------+
                     |      Vercel Serverless Functions      |
                     |       (or Local Express Dev Server)   |
                     |      /api/scrape    /api/analyze      |
                     |      /api/chat      /api/health       |
                     +---------+-----------------+-----------+
                               |                 |
            +------------------v---+         +---v--------------------+
            |   Scraper Pipeline   |         |   AI & Analytics Engine|
            +----------------------+         +------------------------+
            | * Play Store Scraper |         | * Sentiment Engine     |
            |   - Standard / Hindi |         | * Word Cloud Generator |
            |   - Helpful / Rating |         | * Discovery Q&A Agent  |
            | * App Store Scraper  |         | * LLM Synthesis        |
            |   - RSS / API Feeds  |         | * PDF Research Ground  |
            +----------------------+         +------------------------+

```

---

## Directory Structure

```text
gaana-review-analyzer-main/
├── api/                           # Vercel serverless API handlers
│   ├── analyze.js                 # LLM review analysis and summary endpoint
│   ├── chat.js                    # Conversational discovery Q&A endpoint
│   ├── health.js                  # Health check & uptime status endpoint
│   └── scrape.js                  # Live review scraping trigger endpoint
├── data/                          # Grounding and benchmark research data
│   └── Gaana User Review Analysis Research.pdf
├── lib/                           # Core analytical and extraction modules
│   ├── ai.js                      # AI model provider client integration
│   ├── config.js                  # Global configuration, scrapers settings & thresholds
│   ├── discovery-qa.js            # Q&A orchestration and grounding logic
│   ├── handlers.js                # Core business logic reusable across runtimes
│   ├── research-pdf.js            # PDF parser and research excerpt loader
│   ├── review-utils.js            # Text sanitation, deduplication, and normalizers
│   ├── scrape.js                  # Master scraper pipeline orchestrator
│   ├── scrapers/                  # Platform-specific scraper implementations
│   │   ├── apple-reviews.js       # App Store review fetcher
│   │   ├── appstore-rss.js        # App Store XML/RSS fallback parser
│   │   ├── appstore.js            # General Apple App Store scraper wrapper
│   │   ├── playstore-helpful.js   # Play Store helpful-ranked scraper
│   │   ├── playstore-hindi.js     # Play Store localized Hindi scraper
│   │   ├── playstore-rating.js    # Play Store rating-tiered scraper
│   │   ├── playstore-us.js        # Play Store US region scraper
│   │   └── playstore.js           # Play Store base scraper
│   ├── sentiment.js               # Sentiment scoring and polarity classification
│   └── wordcloud.js               # Stopword removal and n-gram term frequencies
├── scripts/                       # Verification, probing, and testing CLI utilities
│   ├── probe-sources.js           # Tests all review extraction channels
│   ├── probe-trustpilot.js        # Secondary external source probe
│   ├── stop-dev.js                # Cleanly terminates running development ports
│   ├── test-scrape.js             # CLI execution test for scrape workflows
│   ├── verify-apple-full-scrape.js# Validates Apple data pipelines end-to-end
│   ├── verify-apple-sources.js    # Probes Apple store availability
│   └── wait-for-api.js            # CI/CD polling utility for server startup
├── server/                        # Development backend environment
│   └── dev-server.js              # Express-compatible server emulating Vercel functions
├── src/                           # Frontend React application
│   ├── App.jsx                    # Core dashboard UI, tabs, charts, and chat panel
│   └── main.jsx                   # React DOM entry point
├── .env.example                   # Environment configuration template
├── CURSOR_CONTEXT.md              # Project context, design guidelines, and rules
├── QUICKSTART.md                  # Quick start instructions
├── vercel.json                    # Vercel deployment routes and serverless settings
└── vite.config.js                 # Vite build setup and development proxy rules

```

---

## Tech Stack

| Layer | Technologies Used |
| --- | --- |
| **Frontend** | React 18, Vite, Modern CSS/Tailwind, Responsive Charts & Badges

 |
| **Backend & Runtime** | Node.js (v18+), Express (`dev-server.js`), Vercel Serverless Functions

 |
| **Data Ingestion** | Custom Play Store & Apple App Store RSS/HTML Scrapers

 |
| **NLP & AI Engine** | LLM API Integration (`lib/ai.js`), Custom Sentiment Analyzer, Word Frequency Engine

 |
| **Research Grounding** | Embedded UX & Review Research Document (`research-pdf.js`)

 |
| **Deployment** | Vercel (Production), Node.js (Local)

 |

---

## Prerequisites

Make sure the following dependencies are installed on your machine:

* **Node.js** (v18.0.0 or higher recommended)
* **npm** (v8.0.0 or higher) or **yarn** / **pnpm**
* An active API key for the configured LLM provider (e.g., Groq, OpenAI, or Gemini)



---

## Getting Started

### 1. Clone & Install

Clone the repository and install all required root dependencies:

```bash
git clone <your-repository-url>
cd gaana-review-analyzer-main
npm install

```

### 2. Configure Environment Variables

Duplicate the template file and set your credentials:

```bash
cp .env.example .env

```

Open `.env` and configure your API keys and runtime parameters:

```env
# AI Model Configuration
AI_API_KEY=your_llm_api_key_here
AI_MODEL=llama-3.3-70b-versatile    # Or your chosen model provider

# Application Port
PORT=3000

```

### 3. Launch Development Server

Start both the API server and the Vite development client concurrently:

```bash
npm run dev

```

Once running:

* **Frontend UI**: `http://localhost:5173` (or port assigned by Vite)


* **API Backend**: `http://localhost:3000`


---

## Available Scripts

In the project directory, you can run:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Boots up the development backend server and Vite frontend client concurrently.

 |
| `npm run build` | Compiles the production-ready React client bundle via Vite.

 |
| `npm run preview` | Previews the compiled production build locally.

 |
| `npm run test:scrape` | Executes `scripts/test-scrape.js` to run a standalone review scrape test in CLI.

 |
| `npm run probe` | Runs `scripts/probe-sources.js` to test connectivity across all review sources.

 |
| `npm run verify:apple` | Probes and validates Apple App Store review fetch pipelines.

 |
| `npm run stop` | Terminates lingering Node processes on active development ports.

 |

---

## API Reference

### 1. Health Check

* **Route**: `GET /api/health`

* **Description**: Verifies that the server and downstream integrations are functional.


* **Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-27T10:57:36.000Z"
}

```



---

### 2. Scrape Reviews

* **Route**: `POST /api/scrape`

* **Description**: Triggers concurrent scraping routines across Google Play and Apple App Store.


* **Request Body** *(Optional)*:
```json
{
  "count": 100,
  "includeHindi": true
}

```


* **Response**: Returns an array of normalized review objects including user ratings, review content, dates, and source platform tags.



---

### 3. Analyze Reviews

* **Route**: `POST /api/analyze`

* **Description**: Evaluates review datasets to calculate sentiment breakdowns, extract high-frequency terms, and generate an AI synthesis of user pain points.


* **Request Body**:
```json
{
  "reviews": [ ... ]
}

```


* **Response**:
```json
{
  "sentiment": {
    "positive": 45,
    "neutral": 15,
    "negative": 40
  },
  "wordCloud": [
    { "text": "subscription", "value": 84 },
    { "text": "ads", "value": 72 },
    { "text": "crash", "value": 53 }
  ],
  "aiInsights": {
    "executiveSummary": "...",
    "keyIssues": [ ... ],
    "featureRequests": [ ... ]
  }
}

```



---

### 4. Discovery Chat (Q&A)

* **Route**: `POST /api/chat`

* **Description**: Interactive conversational agent grounded in review data and the research paper.


* **Request Body**:
```json
{
  "message": "What are the primary complaints regarding Gaana's recent UI update?",
  "history": []
}

```


* **Response**:
```json
{
  "reply": "Based on recent user feedback and research findings, users primarily report...",
  "sources": [ ... ]
}

```



---

## Deployment to Vercel

The project is structured to deploy smoothly to Vercel as a single full-stack project:

1. Push your code to your GitHub / GitLab repository.
2. Import the project into the [Vercel Dashboard](https://vercel.com?utm_source=gemini).
3. Set your environment variables in Vercel's project settings (`AI_API_KEY`, `AI_MODEL`, etc.).


4. Deploy. Vercel automatically maps `/api/*.js` to serverless microservices and serves the compiled Vite assets configured via `vercel.json`.
