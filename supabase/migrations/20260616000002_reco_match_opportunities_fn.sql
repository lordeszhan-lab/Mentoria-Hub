-- ============================================================
-- Mentoria Hub — pgvector cosine-distance ranking function
-- Used by the recommender (vectorRank layer)
-- Applied: 2026-06-16 via Supabase MCP
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

DROP FUNCTION IF EXISTS public.match_opportunities(
  p_vector vector,
  p_ids    uuid[],
  p_limit  int
);

-- Returns rows from the eligible set ordered by cosine distance to p_vector.
-- similarity = 1 - cosine_distance, normalised to [0, 1].
CREATE OR REPLACE FUNCTION public.match_opportunities(
  p_vector vector(1536),
  p_ids    uuid[],
  p_limit  int DEFAULT 20
)
RETURNS TABLE (
  id          uuid,
  similarity  double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    o.id,
    GREATEST(0.0, LEAST(1.0, 1.0 - (o.embedding::vector(1536) <=> p_vector))) AS similarity
  FROM public.opportunities o
  WHERE
    o.id = ANY(p_ids)
    AND o.embedding IS NOT NULL
  ORDER BY o.embedding::vector(1536) <=> p_vector
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.match_opportunities IS
  'Rank eligible opportunities by cosine similarity to a profile vector. Returns id + normalized similarity [0,1].';
