import dotenv from "dotenv";
import { scrapeSource } from "../lib/scrape.js";
import { dedupeReviews } from "../lib/review-utils.js";
import { MIN_REVIEWS_TARGET } from "../lib/config.js";

dotenv.config({ path: ".env.local" });

const args = process.argv.slice(2);
const full = args.includes("--full");

async function runOne(sourceId, page) {
  const label = page ? `${sourceId} p${page}` : sourceId;
  process.stdout.write(`  ${label}... `);
  const result = await scrapeSource(sourceId, { page });
  console.log(`${result.count} (${result.durationMs}ms)`);
  return result.reviews;
}

async function main() {
  if (full) {
    console.log(`Full scrape test (target: ${MIN_REVIEWS_TARGET}+ reviews)\n`);
    const all = [];
    all.push(...await runOne("playstore"));
    all.push(...await runOne("playstore_rating"));
    all.push(...await runOne("playstore_helpful"));
    all.push(...await runOne("playstore_us"));
    all.push(...await runOne("playstore_hindi"));
    for (let p = 1; p <= 10; p++) {
      const batch = await runOne("appstore", p);
      if (!batch.length) break;
      all.push(...batch);
    }
    for (let p = 1; p <= 10; p++) {
      const batch = await runOne("appstore_rss", p);
      if (!batch.length) break;
      all.push(...batch);
    }
    const unique = dedupeReviews(all.map((r) => ({ ...r })));
    console.log(`\n✓ Total raw: ${all.length} → unique: ${unique.length}`);
    process.exit(unique.length >= MIN_REVIEWS_TARGET ? 0 : 1);
  }

  const source = args[0] || "playstore";
  const page = args[1] ? parseInt(args[1], 10) : undefined;
  console.log(`Testing scrape: ${source}${page ? ` page ${page}` : ""}...`);
  const result = await scrapeSource(source, { page });
  console.log(`✓ ${result.source}: ${result.count} reviews in ${result.durationMs}ms`);
  if (result.reviews[0]) console.log("Sample:", result.reviews[0]);
}

main().catch((err) => {
  console.error("✕ Failed:", err.message);
  process.exit(1);
});
