import "server-only";
import { openai } from "./client";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMS = 1536;

/**
 * Embed a text string into a 1536-dimensional vector.
 * Trims and caps input at 8 000 chars to stay well within the model limit.
 */
export async function embedText(text: string): Promise<number[]> {
  const input = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });
  return res.data[0]!.embedding;
}
