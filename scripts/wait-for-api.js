const url = process.env.API_HEALTH_URL || "http://localhost:3001/api/health";

for (let i = 0; i < 40; i++) {
  try {
    const res = await fetch(url);
    if (res.ok) process.exit(0);
  } catch {
    // API not ready yet
  }
  await new Promise((r) => setTimeout(r, 500));
}

console.error("API server did not start in time. Run: npm run dev:api");
process.exit(1);
