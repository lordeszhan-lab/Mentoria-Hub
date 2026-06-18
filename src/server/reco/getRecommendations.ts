/**
 * Recommender orchestration pipeline.
 *
 * Flow: load profile → filterEligible → rankByVector → llmScore (top 10)
 *       → merge scores back → return sorted list with reasons.
 */
import "server-only";

import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { filterEligible } from "./eligibility";
import { rankByVector } from "./vectorRank";
import { llmScore } from "./llmScore";
import { recoError, recoLog } from "./log";
import type { OpportunityRow, ProfileRow } from "@/lib/supabase/types";
import type { RecoItem } from "@/lib/zod/reco";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScoredOpportunity {
  opportunity: OpportunityRow;
  matchScore: number | null;
  reasons: string[];
  caution: string | null;
  coldStart: boolean;
}

export interface GetRecommendationsResult {
  items: ScoredOpportunity[];
  coldStart: boolean;
  /** Set when the pipeline degraded or skipped a stage (for logs / dev UI). */
  pipelineNote?: string;
}

// ── In-memory cache ───────────────────────────────────────────────────────────

interface CacheEntry {
  result: GetRecommendationsResult;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function profileHash(profile: ProfileRow): string {
  const sig = JSON.stringify({
    grade: profile.grade,
    interests: profile.interests,
    subjects: profile.subjects,
    goal: profile.goal,
    country: profile.country,
    updated_at: profile.updated_at,
  });
  return createHash("sha256").update(sig).digest("hex").slice(0, 16);
}

function getCached(key: string): GetRecommendationsResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

function setCached(key: string, result: GetRecommendationsResult): void {
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── Parse profile vector ──────────────────────────────────────────────────────

function parseVector(raw: string | null): number[] | null {
  if (raw == null || raw === "") {
    recoLog("getRecommendations", "profile_vector is null/empty in DB");
    return null;
  }

  recoLog("getRecommendations", "profile_vector raw from DB", {
    type: typeof raw,
    length: raw.length,
    preview: raw.slice(0, 60),
  });

  try {
    // PostgREST may return vector as JSON array string: "[0.1,0.2,...]"
    if (raw.startsWith("[")) {
      const arr = JSON.parse(raw) as unknown;
      if (Array.isArray(arr) && arr.length > 0) {
        recoLog("getRecommendations", "parsed profile_vector as JSON array", {
          dims: arr.length,
        });
        return arr as number[];
      }
    }

    // pgvector text format: "[0.1,0.2,...]" without JSON.parse path above
    // or comma-separated floats
    const trimmed = raw.replace(/^\[|\]$/g, "");
    const parts = trimmed.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length > 0 && !parts.some((n) => Number.isNaN(n))) {
      recoLog("getRecommendations", "parsed profile_vector as comma-separated", {
        dims: parts.length,
      });
      return parts;
    }

    recoError("getRecommendations", "could not parse profile_vector", null, {
      preview: raw.slice(0, 120),
    });
    return null;
  } catch (err) {
    recoError("getRecommendations", "profile_vector JSON.parse failed", err, {
      preview: raw.slice(0, 120),
    });
    return null;
  }
}

// ── Detail-page on-demand result ─────────────────────────────────────────────

export interface DetailMatchResult {
  scored: ScoredOpportunity | null;
  /** True when profile_vector is absent — the user truly hasn't completed onboarding. */
  noProfileVector: boolean;
  /** True when on-demand scoring was attempted but errored (profile is fine). */
  scoringFailed: boolean;
}

// ── Main export ───────────────────────────────────────────────────────────────

const LLM_SHORTLIST_SIZE = 10;
const MAX_RECOMMENDED = 6;

const EMPTY: GetRecommendationsResult = { items: [], coldStart: false };

/**
 * Build personalised recommendations for a user.
 */
export async function getRecommendations(
  userId: string,
): Promise<GetRecommendationsResult> {
  const runId = `${userId.slice(0, 8)}-${Date.now()}`;
  recoLog("getRecommendations", `── pipeline start runId=${runId} ──`, { userId });

  const pipelineWork = async (): Promise<GetRecommendationsResult> => {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // ── 1. Load profile ─────────────────────────────────────────────────
    let profile: ProfileRow | null = null;
    try {
      const { data, error: profileError } = (await db
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()) as { data: ProfileRow | null; error: { message: string } | null };

      if (profileError) {
        recoError("getRecommendations", "profile fetch failed", profileError);
        return { ...EMPTY, pipelineNote: `profile_fetch: ${profileError.message}` };
      }

      profile = data;

      recoLog("getRecommendations", "profile loaded", {
        found: !!profile,
        onboarding_completed: profile?.onboarding_completed ?? false,
        grade: profile?.grade ?? null,
        has_profile_vector: profile?.profile_vector != null,
        profile_vector_preview: profile?.profile_vector?.slice(0, 40) ?? null,
      });

      if (!profile || !profile.onboarding_completed) {
        recoLog("getRecommendations", "abort — no profile or onboarding incomplete");
        return { items: [], coldStart: false, pipelineNote: "onboarding_incomplete" };
      }
    } catch (err) {
      recoError("getRecommendations", "profile load threw", err);
      return { ...EMPTY, pipelineNote: "profile_load_error" };
    }

    // ── 2. Cache check ──────────────────────────────────────────────────
    const cacheKey = `${userId}:${profileHash(profile)}`;
    const cached = getCached(cacheKey);
    if (cached) {
      recoLog("getRecommendations", "cache hit — returning cached result", {
        itemCount: cached.items.length,
        coldStart: cached.coldStart,
      });
      return cached;
    }

    // ── 3. Load published opportunities ─────────────────────────────────
    let allOpps: OpportunityRow[] = [];
    try {
      const { data, error: oppsError } = (await db
        .from("opportunities")
        .select("*")
        .eq("status", "published")) as {
        data: OpportunityRow[] | null;
        error: { message: string } | null;
      };

      if (oppsError) {
        recoError("getRecommendations", "opportunities fetch failed", oppsError);
        return { ...EMPTY, pipelineNote: `opps_fetch: ${oppsError.message}` };
      }

      allOpps = data ?? [];

      recoLog("getRecommendations", "opportunities loaded", {
        publishedCount: allOpps.length,
        withEmbeddingField: allOpps.filter((o) => o.embedding != null).length,
      });

      if (allOpps.length === 0) {
        return { items: [], coldStart: false, pipelineNote: "no_published_opportunities" };
      }
    } catch (err) {
      recoError("getRecommendations", "opportunities load threw", err);
      return { ...EMPTY, pipelineNote: "opps_load_error" };
    }

    // ── 4. Eligibility ──────────────────────────────────────────────────
    let eligible: OpportunityRow[] = [];
    try {
      eligible = filterEligible(profile, allOpps);
      if (eligible.length === 0) {
        recoLog("getRecommendations", "no eligible opportunities after filter");
        return { items: [], coldStart: false, pipelineNote: "no_eligible" };
      }
    } catch (err) {
      recoError("getRecommendations", "filterEligible threw", err);
      return { ...EMPTY, pipelineNote: "eligibility_error" };
    }

    // ── 5. Vector ranking ───────────────────────────────────────────────
    let ranked: Awaited<ReturnType<typeof rankByVector>>["ranked"] = [];
    let coldStart = false;
    let coldStartReason: string | undefined;

    try {
      const profileVector = parseVector(profile.profile_vector);
      const rankResult = await rankByVector(profileVector, eligible, LLM_SHORTLIST_SIZE);
      ranked = rankResult.ranked;
      coldStart = rankResult.coldStart;
      coldStartReason = rankResult.coldStartReason;

      recoLog("getRecommendations", "vectorRank complete", {
        rankedCount: ranked.length,
        coldStart,
        coldStartReason: coldStartReason ?? null,
      });

      if (ranked.length === 0) {
        return {
          items: [],
          coldStart,
          pipelineNote: coldStartReason ?? "vector_rank_empty",
        };
      }
    } catch (err) {
      recoError("getRecommendations", "rankByVector threw", err);
      return { ...EMPTY, pipelineNote: "vector_rank_error" };
    }

    // ── 6. LLM scoring ──────────────────────────────────────────────────
    const scoreMap = new Map<string, RecoItem>();
    let llmSkipped = false;
    let llmError: string | undefined;

    if (coldStart) {
      recoLog("getRecommendations", "skipping LLM — coldStart=true", {
        reason: coldStartReason ?? "unknown",
      });
      llmSkipped = true;
    } else {
      try {
        const shortlist = ranked.slice(0, LLM_SHORTLIST_SIZE).map((r) => r.opportunity);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("llmScore timed out after 30s")), 30_000),
        );

        const scores = await Promise.race([llmScore(profile, shortlist), timeoutPromise]);
        for (const s of scores) {
          scoreMap.set(s.opportunity_id, s);
        }
        recoLog("getRecommendations", "llmScore complete", { scoredCount: scores.length });
      } catch (err) {
        llmError = err instanceof Error ? err.message : String(err);
        recoError("getRecommendations", "llmScore failed or timed out — using similarity fallback", err);
      }
    }

    // ── 7. Merge and sort ───────────────────────────────────────────────
    const merged: ScoredOpportunity[] = ranked
      .slice(0, LLM_SHORTLIST_SIZE)
      .map((r) => {
        const llm = scoreMap.get(r.opportunity.id);
        if (llm) {
          return {
            opportunity: r.opportunity,
            matchScore: llm.match_score,
            reasons: llm.reasons,
            caution: llm.caution,
            coldStart: false,
          };
        }
        const similarityScore =
          r.similarity != null ? Math.round(r.similarity * 100) : null;
        return {
          opportunity: r.opportunity,
          matchScore: similarityScore,
          reasons: [],
          caution: null,
          coldStart,
        };
      });

    merged.sort((a, b) => {
      if (a.matchScore == null && b.matchScore == null) return 0;
      if (a.matchScore == null) return 1;
      if (b.matchScore == null) return -1;
      return b.matchScore - a.matchScore;
    });

    const result: GetRecommendationsResult = {
      items: merged.slice(0, MAX_RECOMMENDED),
      coldStart,
      pipelineNote: coldStart
        ? coldStartReason ?? "cold_start"
        : llmError
          ? `llm_fallback: ${llmError}`
          : llmSkipped
            ? "llm_skipped_cold_start"
            : undefined,
    };

    recoLog("getRecommendations", `── pipeline complete runId=${runId} ──`, {
      itemCount: result.items.length,
      coldStart: result.coldStart,
      pipelineNote: result.pipelineNote ?? null,
      scores: result.items.map((i) => ({
        id: i.opportunity.id.slice(0, 8),
        score: i.matchScore,
      })),
    });

    // Only cache successful LLM results (or valid cold-start results).
    // If the LLM timed out or errored, skip caching so the next request retries.
    if (!llmError) {
      setCached(cacheKey, result);
    } else {
      recoLog("getRecommendations", "skipping cache — LLM degraded, will retry on next request");
    }
    return result;
  };

  try {
    return await pipelineWork();
  } catch (err) {
    recoError("getRecommendations", "pipeline threw unexpectedly", err, { runId });
    return { ...EMPTY, pipelineNote: "pipeline_unhandled_error" };
  }
}

// ── Detail-page scoring ───────────────────────────────────────────────────────

/**
 * Score a single opportunity for the detail page.
 *
 * 1. Consults the in-process recommendations cache first — instant if the user
 *    just visited the catalog page.
 * 2. Falls back to an on-demand single-item LLM call when the opportunity was
 *    not in the cached top-6 shortlist (e.g. opened from "All opportunities").
 */
export async function scoreForDetailPage(
  userId: string,
  opportunity: OpportunityRow,
): Promise<DetailMatchResult> {
  const runId = `detail-${opportunity.id.slice(0, 8)}-${Date.now()}`;
  recoLog("scoreForDetailPage", `── start runId=${runId} ──`, {
    userId,
    opportunityId: opportunity.id,
  });

  try {
    // ── 1. Check recommendations cache (getRecommendations is fast on cache hit) ─
    const recoResult = await getRecommendations(userId);

    // Cold start means profile_vector is genuinely missing.
    if (recoResult.coldStart) {
      recoLog("scoreForDetailPage", "cold start — profile_vector absent");
      return { scored: null, noProfileVector: true, scoringFailed: false };
    }

    const cached = recoResult.items.find((i) => i.opportunity.id === opportunity.id);
    if (cached) {
      recoLog("scoreForDetailPage", "cache hit — returning cached result", {
        matchScore: cached.matchScore,
      });
      return { scored: cached, noProfileVector: false, scoringFailed: false };
    }

    recoLog(
      "scoreForDetailPage",
      "opportunity not in top-6 recommendations — running on-demand scoring",
    );

    // ── 2. Load profile for on-demand scoring ─────────────────────────────────
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: profile, error: profileError } = (await db
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()) as { data: ProfileRow | null; error: { message: string } | null };

    if (profileError || !profile) {
      recoError("scoreForDetailPage", "profile load failed", profileError);
      return { scored: null, noProfileVector: false, scoringFailed: true };
    }

    const profileVector = parseVector(profile.profile_vector);
    if (!profileVector) {
      recoLog("scoreForDetailPage", "no profile_vector — cannot score on-demand");
      return { scored: null, noProfileVector: true, scoringFailed: false };
    }

    // ── 3. Vector similarity (best-effort, single item) ───────────────────────
    let similarity: number | null = null;
    try {
      const rankResult = await rankByVector(profileVector, [opportunity], 1);
      similarity = rankResult.ranked[0]?.similarity ?? null;
      recoLog("scoreForDetailPage", "vector similarity computed", { similarity });
    } catch (err) {
      recoError(
        "scoreForDetailPage",
        "rankByVector failed for single item — continuing without similarity",
        err,
      );
    }

    // ── 4. LLM scoring (single item, 12 s timeout) ────────────────────────────
    try {
      const scores = await Promise.race([
        llmScore(profile, [opportunity]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("llmScore timed out after 12s")), 12_000),
        ),
      ]);
      const s = scores[0];
      if (s) {
        recoLog("scoreForDetailPage", "on-demand LLM scoring complete", {
          matchScore: s.match_score,
          reasonCount: s.reasons.length,
        });
        return {
          scored: {
            opportunity,
            matchScore: s.match_score,
            reasons: s.reasons,
            caution: s.caution,
            coldStart: false,
          },
          noProfileVector: false,
          scoringFailed: false,
        };
      }
    } catch (err) {
      recoError(
        "scoreForDetailPage",
        "on-demand LLM scoring failed — falling back to similarity score",
        err,
      );
    }

    // ── 5. Similarity-only fallback ───────────────────────────────────────────
    if (similarity != null) {
      recoLog("scoreForDetailPage", "using similarity-only fallback", { similarity });
      return {
        scored: {
          opportunity,
          matchScore: Math.round(similarity * 100),
          reasons: [],
          caution: null,
          coldStart: false,
        },
        noProfileVector: false,
        scoringFailed: false,
      };
    }

    recoLog("scoreForDetailPage", "no similarity or LLM result — scoring failed");
    return { scored: null, noProfileVector: false, scoringFailed: true };
  } catch (err) {
    recoError("scoreForDetailPage", "unexpected error", err);
    return { scored: null, noProfileVector: false, scoringFailed: true };
  }
}
