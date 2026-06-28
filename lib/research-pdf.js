import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { RESEARCH_PDF_FILENAME } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_PATH = join(__dirname, "..", "data", RESEARCH_PDF_FILENAME);

let cachedText = null;

/** Extract plain text from the bundled research PDF (cached after first read). */
export async function loadResearchPdfText() {
  if (cachedText) return cachedText;
  if (!existsSync(PDF_PATH)) {
    throw new Error(`Research PDF not found at data/${RESEARCH_PDF_FILENAME}`);
  }

  const buffer = readFileSync(PDF_PATH);
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  cachedText = (result.text || "").replace(/\s+/g, " ").trim();
  return cachedText;
}

export function getResearchPdfPath() {
  return PDF_PATH;
}
