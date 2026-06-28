/** Map raw Google Play review rows to normalized review objects. */
export function mapPlayStoreReviews(rows, sourceLabel, idPrefix = "ps") {
  return rows
    .map((r, i) => ({
      id: `${idPrefix}_${r.id || i}`,
      source: sourceLabel,
      author: r.userName || "play_user",
      rating: r.score,
      comment: (r.text || "").trim(),
      date: r.date ? new Date(r.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }))
    .filter((r) => r.comment.length > 5);
}

/** Deduplicate reviews by id, then by source+comment prefix. */
export function dedupeReviews(reviews) {
  const seenId = new Set();
  const seenComment = new Set();
  return reviews.filter((r) => {
    if (seenId.has(r.id)) return false;
    const key = `${r.source}|${r.comment.slice(0, 120).toLowerCase()}`;
    if (seenComment.has(key)) return false;
    seenId.add(r.id);
    seenComment.add(key);
    return true;
  });
}
