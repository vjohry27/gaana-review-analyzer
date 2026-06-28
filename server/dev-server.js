import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { handleScrape, handleAnalyze, handleChat, handleHealth } from "../lib/handlers.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.options("/api/*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

app.get("/api/scrape", (req, res) => handleScrape(req, res));
app.post("/api/analyze", (req, res) => handleAnalyze(req, res));
app.post("/api/chat", (req, res) => handleChat(req, res));

app.get("/api/health", (req, res) => handleHealth(req, res));

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
