import { handleChat } from "../lib/handlers.js";

export default function handler(req, res) {
  return handleChat(req, res);
}
