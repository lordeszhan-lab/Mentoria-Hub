-- weekly_leaderboard(): returns current ISO-week XP rankings, excluding admins.
-- RANK() is used so ties share the same rank (e.g. two users both at #3).
-- date_trunc('week', ...) in PostgreSQL anchors to ISO Monday 00:00 UTC.

CREATE OR REPLACE FUNCTION public.weekly_leaderboard()
RETURNS TABLE (
  user_id   uuid,
  display_name text,
  weekly_xp bigint,
  rank      bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH week_bounds AS (
    SELECT
      date_trunc('week', now() AT TIME ZONE 'UTC') AS week_start,
      date_trunc('week', now() AT TIME ZONE 'UTC') + INTERVAL '7 days' AS week_end
  ),
  week_xp AS (
    SELECT
      e.user_id,
      COALESCE(SUM(e.amount), 0)::bigint AS weekly_xp
    FROM public.xp_events e, week_bounds wb
    WHERE
      e.created_at >= wb.week_start
      AND e.created_at <  wb.week_end
    GROUP BY e.user_id
  ),
  ranked AS (
    SELECT
      w.user_id,
      COALESCE(p.full_name, 'Student') AS display_name,
      w.weekly_xp,
      RANK() OVER (ORDER BY w.weekly_xp DESC) AS rank
    FROM week_xp w
    INNER JOIN public.profiles p ON p.id = w.user_id
    WHERE p.role <> 'admin'
      AND w.weekly_xp > 0
  )
  SELECT
    r.user_id,
    r.display_name,
    r.weekly_xp,
    r.rank
  FROM ranked r
  ORDER BY r.rank ASC, r.display_name ASC;
$$;

-- Grant execute to authenticated users so the function is callable from the
-- client-side Supabase client as well as the service-role admin client.
GRANT EXECUTE ON FUNCTION public.weekly_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.weekly_leaderboard() TO service_role;
