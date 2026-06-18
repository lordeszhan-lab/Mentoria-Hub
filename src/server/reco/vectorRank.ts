/**
 * Vector ranking layer — calls the pgvector SQL function `match_opportunities`
 * to sort an already-eligible set by cosine similarity to the profile vector.
 *
 * Cold-start path: if the profile has no vector yet, fall back to a
 * recency-first + category-diversity ordering and flag coldStart=true.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { OpportunityRow } from "@/lib/supabase/types";
import { recoError, recoLog } from "./log";

export interface RankedOpportunity {
  opportunity: OpportunityRow;
  /** Cosine similarity in [0, 1]. Null when coldStart=true. */
  similarity: number | null;
}

export interface VectorRankResult {
  ranked: RankedOpportunity[];
  coldStart: boolean;
  /** Human-readable reason when coldStart=true (for logs / UI diagnostics). */
  coldStartReason?: string;
}

// ── Cold-start fallback ───────────────────────────────────────────────────────

function diversifyByCategoryRoundRobin(opps: OpportunityRow[]): OpportunityRow[] {
  const buckets = new Map<string | null, OpportunityRow[]>();
  for (const opp of opps) {
    const key = opp.category_id ?? null;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(opp);
  }
  const result: OpportunityRow[] = [];
  const arrays = [...buckets.values()];
  let remaining = opps.length;
  while (remaining > 0) {
    for (const bucket of arrays) {
      if (bucket.length > 0) {
        result.push(bucket.shift()!);
        remaining--;
      }
    }
  }
  return result;
}

function coldStartOrder(opps: OpportunityRow[]): OpportunityRow[] {
  const withDeadline = opps
    .filter((o) => o.deadline != null)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  const withoutDeadline = opps.filter((o) => o.deadline == null);

  return diversifyByCategoryRoundRobin([...withDeadline, ...withoutDeadline]);
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Rank `eligibleOpportunities` by cosine similarity to `profileVector`.
 */
export async function rankByVector(
  profileVector: number[] | null,
  eligibleOpportunities: OpportunityRow[],
  limit = 30,
): Promise<VectorRankResult> {
  recoLog("vectorRank", "rankByVector start", {
    profileVectorLength: profileVector?.length ?? 0,
    eligibleCount: eligibleOpportunities.length,
    limit,
    eligibleWithEmbedding: eligibleOpportunities.filter((o) => o.embedding != null).length,
  });

  if (eligibleOpportunities.length === 0) {
    recoLog("vectorRank", "no eligible opportunities — empty result");
    return {
      ranked: [],
      coldStart: profileVector == null,
      coldStartReason: profileVector == null ? "no_profile_vector" : undefined,
    };
  }

  // ── Cold start: no profile vector ─────────────────────────────────────────
  if (profileVector == null || profileVector.length === 0) {
    recoLog("vectorRank", "COLD START — profile_vector missing or empty", {
      reason: "no_profile_vector",
      note: "Opportunity embeddings exist but vector ranking cannot run without profiles.profile_vector",
    });
    const ordered = coldStartOrder(eligibleOpportunities).slice(0, limit);
    return {
      ranked: ordered.map((opp) => ({ opportunity: opp, similarity: null })),
      coldStart: true,
      coldStartReason: "no_profile_vector",
    };
  }

  if (profileVector.length !== 1536) {
    recoError("vectorRank", "profile vector dimension mismatch — expected 1536", null, {
      actualLength: profileVector.length,
    });
  }

  // ── Vector search via RPC ───────────────────────────────────────────────────
  try {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const eligibleIds = eligibleOpportunities.map((o) => o.id);

    const rpcArgs = {
      p_vector: JSON.stringify(profileVector),
      p_ids: eligibleIds,
      p_limit: limit,
    };

    recoLog("vectorRank", "calling match_opportunities RPC", {
      p_ids_count: eligibleIds.length,
      p_limit: limit,
      p_vector_dims: profileVector.length,
      p_vector_preview: profileVector.slice(0, 3),
    });

    const { data, error } = await db.rpc("match_opportunities", rpcArgs);

    if (error) {
      recoError("vectorRank", "match_opportunities RPC failed — falling back to cold-start order", error, {
        rpcMessage: error.message,
        rpcCode: error.code ?? null,
        rpcDetails: error.details ?? null,
        rpcHint: error.hint ?? null,
        hint: "Check migration reco_match_opportunities_fn.sql and pgvector extension",
      });
      const ordered = coldStartOrder(eligibleOpportunities).slice(0, limit);
      return {
        ranked: ordered.map((opp) => ({ opportunity: opp, similarity: null })),
        coldStart: true,
        coldStartReason: `rpc_error: ${error.message}`,
      };
    }

    const rows = (data as Array<{ id: string; similarity: number }>) ?? [];

    recoLog("vectorRank", "match_opportunities RPC success", {
      rowCount: rows.length,
      topSimilarity: rows[0]?.similarity ?? null,
      sampleIds: rows.slice(0, 3).map((r) => r.id),
    });

    if (rows.length === 0) {
      recoLog("vectorRank", "RPC returned 0 rows — eligible opps may lack embeddings in DB", {
        eligibleWithEmbeddingField: eligibleOpportunities.filter((o) => o.embedding != null).length,
      });
    }

    const oppById = new Map(eligibleOpportunities.map((o) => [o.id, o]));

    const ranked: RankedOpportunity[] = rows
      .filter((r) => oppById.has(r.id))
      .map((r) => ({
        opportunity: oppById.get(r.id)!,
        similarity: r.similarity,
      }));

    const rankedIds = new Set(ranked.map((r) => r.opportunity.id));
    const unembedded = eligibleOpportunities
      .filter((o) => !rankedIds.has(o.id))
      .slice(0, limit - ranked.length);

    if (unembedded.length > 0) {
      recoLog("vectorRank", "appending eligible opps not returned by RPC (no embedding match)", {
        unembeddedCount: unembedded.length,
      });
    }

    for (const opp of unembedded) {
      ranked.push({ opportunity: opp, similarity: null });
    }

    recoLog("vectorRank", "rankByVector complete (vector path)", {
      rankedCount: ranked.length,
      coldStart: false,
    });

    return { ranked, coldStart: false };
  } catch (err) {
    recoError("vectorRank", "unexpected error in rankByVector", err);
    const ordered = coldStartOrder(eligibleOpportunities).slice(0, limit);
    return {
      ranked: ordered.map((opp) => ({ opportunity: opp, similarity: null })),
      coldStart: true,
      coldStartReason: err instanceof Error ? err.message : "unknown_error",
    };
  }
}
