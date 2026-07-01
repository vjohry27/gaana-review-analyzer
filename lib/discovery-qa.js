/** Fixed Q&A for AI Discovery Summary — sourced from VJ.docx, never generated dynamically. */
export const HARDCODED_DISCOVERY_QA = [
  {
    question: "Why do users struggle to discover new music?",
    answer:
      "Recent reviews confirm that search remains broken: one user found that the app consistently failed to return accurate results, whether searching for songs, artists, or genres.",
    highlights: [
      "Algorithmic echo chambers — locked into the same 20–30 repeated tracks",
      "Weak search — exact-string matching, zero tolerance for typos",
      'Broken paywall UX — active subscribers are repeatedly prompted to "buy a plan"',
      "Rigid language silos — selected language hard-blocks adjacent regional/global content",
    ],
  },
  {
    question: "What are the most common frustrations with recommendations?",
    answer: "From the reviews, the following are the common frustrations users are facing:",
    highlights: [
      "Automated track-loop bias — autoplay defaults to the same 5 trending tracks",
      '"Algorithm poisoning" with no reset — one stray play permanently skews the profile',
      "Overemphasis on mainstream/Bollywood — despite explicit indie preference",
      "Mood/context mismatch — jarring genre switches mid-playlist",
      'Erroneous "Fans Also Like" mapping — irrelevant similar-artist suggestions',
    ],
  },
  {
    question: "What listening behaviors are users trying to achieve?",
    answer: "From the reviews, the following listening behaviors were analyzed.",
    highlights: [
      "Lean-back local discovery — effortless surfacing of emerging regional/indie music",
      "Contextual mood pacing — seamless backdrops for work, sleep, study",
      "Social/curatorial expression — building and showcasing personal playlists",
      "Nostalgia catalog retrieval — deep B-side cuts from specific eras, not just top hits.",
    ],
  },
  {
    question: "What causes users to listen to the same content repeatedly?",
    answer: "Based on the reviews scraped, users are listening to the same content due to,",
    highlights: [
      'UI architecture — "Recently Played" dominates top 40% of home screen; discovery tools are buried 3 menus deep.',
      "Algorithmic design — last-30-days overweighting; 5 plays of a track dominate the recommendation vector; passive listening is misread as a strong preference.",
    ],
  },
  {
    question: "Which user segments experience different discovery challenges?",
    answer:
      "From the scraped reviews, the following are the key findings about the segments facing discovery issues.",
    highlights: [
      "Vernacular TrueFan (heavy regional listener) — total algorithmic siloing once tagged; High severity",
      "Connected Commuter (CarPlay users) — no voice intent, unsafe text-heavy menus while driving; High severity",
      "Modern Indie Enthusiast — drowned out by legacy Bollywood deals; Medium severity",
      "Legacy Subscriber — loses personalized mixes after UI redesigns; Medium severity",
    ],
  },
  {
    question: "What unmet needs emerge consistently across reviews?",
    answer: "Reviews point to a recurring set of unmet needs:",
    highlights: [
      'Granular algorithmic tuning controls — users want an explicit "don\'t play this again" option or a way to reset/clear their recommendation profile',
      "Cross-language discovery — rigid language silos prevent natural exploration across related languages and regions",
      "Deep contextual-aware discovery — recommendations that adapt to real-world context like time-of-day, weather, or activity",
      'Recommendation transparency — users want to understand why content is being suggested, rather than feeling like they\'re being "advertised at"',
      "New & urgent — billing/refund trust — growing reports of unauthorized autopay charges, with one user stating renewals continued without consent, and the cancel option was disabled, with no response from customer support",
    ],
  },
];

export function getHardcodedDiscoveryQuestions() {
  return HARDCODED_DISCOVERY_QA.map((item) => ({
    question: item.question,
    answer: item.answer,
    highlights: [...item.highlights],
  }));
}
