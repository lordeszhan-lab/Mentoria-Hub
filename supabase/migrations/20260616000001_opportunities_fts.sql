-- ============================================================
-- Mentoria Hub — Full-text search for opportunities
-- Applied: 2026-06-16 via Supabase MCP
-- ============================================================

-- Generated tsvector column for full-text search.
-- Combines title + description + requirements (English stemming).
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(requirements, '')
    )
  ) STORED;

-- GIN index for performant FTS queries via PostgREST .textSearch()
CREATE INDEX IF NOT EXISTS opportunities_search_vector_idx
  ON public.opportunities USING gin(search_vector);
