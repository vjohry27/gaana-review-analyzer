const STOP = new Set([
  "about", "after", "also", "been", "before", "being", "could", "does", "from",
  "have", "just", "like", "more", "much", "only", "really", "than", "that",
  "their", "them", "then", "there", "these", "they", "this", "very", "what",
  "when", "with", "would", "your", "gaana", "app", "apps", "music", "song", "songs",
]);

export function buildWordCloud(reviews, limit = 28) {
  const freq = {};
  reviews.forEach((r) => {
    r.comment
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w))
      .forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([text, value]) => ({
      text,
      value,
      sentiment: dominantSentiment(text, reviews),
    }));
}

function dominantSentiment(word, reviews) {
  const matching = reviews.filter((r) => r.comment.toLowerCase().includes(word));
  if (!matching.length) return "neutral";
  const counts = { positive: 0, negative: 0, neutral: 0 };
  matching.forEach((r) => { counts[r.sentiment] += 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}
