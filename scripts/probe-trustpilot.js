const res = await fetch("https://www.trustpilot.com/review/gaana.com", {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
    Accept: "text/html",
    "Accept-Language": "en-US,en;q=0.9",
  },
});
console.log("status", res.status);
const html = await res.text();
const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (match) {
  const data = JSON.parse(match[1]);
  const reviews = data?.props?.pageProps?.reviews ?? data?.props?.pageProps?.businessUnit?.reviews;
  console.log("next data keys", Object.keys(data?.props?.pageProps || {}));
  console.log("reviews?", Array.isArray(reviews) ? reviews.length : typeof reviews);
} else {
  console.log("no next data, html len", html.length);
}
