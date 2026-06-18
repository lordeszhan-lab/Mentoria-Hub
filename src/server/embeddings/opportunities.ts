/**
 * Embeddings backfill for opportunities — standalone CLI script.
 *
 * This file intentionally does NOT import any server-only-guarded module so it
 * can be executed directly by tsx outside the Next.js runtime.
 *
 * The app-facing OpenAI / Supabase helpers (src/lib/openai/*, src/lib/supabase/admin.ts)
 * keep their `import "server-only"` guards untouched — this script simply creates
 * equivalent inline clients using process.env.
 *
 * Run via:  npm run embed:opportunities
 *           npm run embed:opportunities -- --force
 */

// Must be the very first import so env vars are available to everything below.
import { config } from "dotenv";
config({ path: ".env.local" });

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import type { OpportunityRow, CategoryRow } from "@/lib/supabase/types";

// ── Inline clients (no server-only) ──────────────────────────────────────────

function makeClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const openai = new OpenAI({ apiKey });

  return { supabase, openai };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function composeText(opp: OpportunityRow, category: CategoryRow | null): string {
  return [
    opp.title,
    category?.name_en ?? "",
    opp.type.replace(/_/g, " "),
    opp.format ?? "",
    opp.region ?? "",
    opp.description,
    opp.requirements ?? "",
    (opp.tags ?? []).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
    .slice(0, 8000);
}

async function embedText(openai: OpenAI, text: string): Promise<number[]> {
  const input = text.replace(/\s+/g, " ").trim();
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });
  return res.data[0]!.embedding;
}

// ── Main backfill logic ───────────────────────────────────────────────────────

export async function embedOpportunities(opts?: { force?: boolean }) {
  const { supabase, openai } = makeClients();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db.from("opportunities").select("*").eq("status", "published");
  if (!opts?.force) {
    query = query.is("embedding", null);
  }

  const { data: opportunities, error } = (await query) as {
    data: OpportunityRow[] | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(`Failed to fetch opportunities: ${error.message}`);

  if (!opportunities?.length) {
    console.log("✓ Nothing to embed.");
    return { embedded: 0 };
  }

  const { data: categories } = (await db.from("categories").select("*")) as {
    data: CategoryRow[] | null;
  };
  const catById: Record<string, CategoryRow> = Object.fromEntries(
    (categories ?? []).map((c: CategoryRow) => [c.id, c]),
  );

  console.log(`Embedding ${opportunities.length} opportunit${opportunities.length === 1 ? "y" : "ies"}…`);

  let embedded = 0;
  for (const opp of opportunities) {
    const category = opp.category_id ? (catById[opp.category_id] ?? null) : null;
    const text = composeText(opp, category);

    try {
      const embedding = await embedText(openai, text);
      const { error: upErr } = await db
        .from("opportunities")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", opp.id);

      if (upErr) {
        console.error(`  ✗ ${opp.title} — ${(upErr as { message: string }).message}`);
      } else {
        console.log(`  ✓ ${opp.title}`);
        embedded++;
      }
    } catch (e) {
      console.error(`  ✗ ${opp.title} — ${String(e)}`);
    }
  }

  console.log(`Done. ${embedded}/${opportunities.length} embedded.`);
  return { embedded };
}

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  const force = process.argv.includes("--force");
  embedOpportunities({ force })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
