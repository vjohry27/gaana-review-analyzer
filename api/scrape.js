import { handleScrape } from "../lib/handlers.js";

export default function handler(req, res) {
  return handleScrape(req, res);
}
