import "server-only";
import OpenAI from "openai";

/**
 * Shared OpenAI client — server-only.
 * Instantiated once per module import (Node.js module cache).
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
