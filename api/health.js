import { handleHealth } from "../lib/handlers.js";

export default function handler(req, res) {
  return handleHealth(req, res);
}
