/** Map star ratings to sentiment buckets. */
export function sentimentFromRating(rating) {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

/** Lightweight keyword sentiment for text-only sources without star ratings. */
const POS = ["love", "great", "best", "awesome", "excellent", "amazing", "good", "perfect", "recommend"];
const NEG = ["hate", "worst", "bad", "crash", "slow", "bug", "terrible", "awful", "frustrating", "ads"];

export function sentimentFromText(text) {
  const lower = text.toLowerCase();
  let score = 0;
  POS.forEach((w) => { if (lower.includes(w)) score += 1; });
  NEG.forEach((w) => { if (lower.includes(w)) score -= 1; });
  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

export function normalizeReview(partial) {
  const rating = partial.rating ?? 3;
  return {
    id: partial.id,
    source: partial.source,
    author: partial.author || "anonymous",
    rating,
    comment: (partial.comment || "").trim(),
    date: partial.date || new Date().toISOString().split("T")[0],
    sentiment: partial.sentiment || sentimentFromRating(rating),
  };
}

export function filterLast12Months(reviews) {
  return filterRecent(reviews, 12);
}

export function filterRecent(reviews, months = 12) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return reviews.filter((r) => new Date(r.date) >= cutoff);
}
