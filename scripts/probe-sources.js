const tests = [
  ["pullpush", "https://api.pullpush.io/reddit/search/comment/?q=gaana+app&size=10"],
  ["pullpush submission", "https://api.pullpush.io/reddit/search/submission/?q=gaana+app&size=10"],
];

for (const [name, url] of tests) {
  const res = await fetch(url);
  const data = await res.json();
  console.log(name, res.status, "items", data.data?.length ?? 0, data.data?.[0]?.body?.slice(0, 50));
}
