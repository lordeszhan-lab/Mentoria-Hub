/**
 * Eligibility layer — hard, deterministic filters applied before vector ranking.
 * Pure function: no DB calls, no LLM, no side-effects.
 */
import type { ProfileRow, OpportunityRow } from "@/lib/supabase/types";
import { recoLog } from "./log";

// How we decide "region compatible" (generous):
// - If the opportunity has no region set → always eligible.
// - If the profile has no country/city → always eligible (we cannot rule them out).
// - Otherwise we do a case-insensitive substring check in either direction.
//   "Kazakhstan" matches "Central Asia / Kazakhstan" and vice-versa.
function regionCompatible(profile: ProfileRow, opp: OpportunityRow): boolean {
  const oppRegion = opp.region?.trim().toLowerCase();
  if (!oppRegion) return true;

  const userCountry = profile.country?.trim().toLowerCase();
  const userCity = profile.city?.trim().toLowerCase();
  if (!userCountry && !userCity) return true;

  // "online" or "worldwide" opportunities are open to everyone
  if (oppRegion === "online" || oppRegion === "worldwide" || oppRegion === "international") {
    return true;
  }

  if (userCountry && (oppRegion.includes(userCountry) || userCountry.includes(oppRegion))) {
    return true;
  }
  if (userCity && (oppRegion.includes(userCity) || userCity.includes(oppRegion))) {
    return true;
  }

  return false;
}

/**
 * Returns the subset of `opportunities` that a user with `profile` is eligible for.
 *
 * Hard filters (all must pass):
 *  1. status === 'published'
 *  2. deadline is null or in the future
 *  3. profile.grade is within [min_grade, max_grade] — null bounds are open
 *  4. region compatible (generous matching defined above)
 */
export function filterEligible(
  profile: ProfileRow,
  opportunities: OpportunityRow[],
): OpportunityRow[] {
  const now = Date.now();

  const eligible = opportunities.filter((opp) => {
    // 1. Must be published
    if (opp.status !== "published") return false;

    // 2. Deadline must be null or in the future
    if (opp.deadline != null) {
      const deadlineMs = new Date(opp.deadline).getTime();
      if (deadlineMs < now) return false;
    }

    // 3. Grade range — null bounds are open (pass everything)
    if (profile.grade != null) {
      if (opp.min_grade != null && profile.grade < opp.min_grade) return false;
      if (opp.max_grade != null && profile.grade > opp.max_grade) return false;
    }

    // 4. Region compatibility
    if (!regionCompatible(profile, opp)) return false;

    return true;
  });

  recoLog("eligibility", "filterEligible complete", {
    inputCount: opportunities.length,
    eligibleCount: eligible.length,
    profileGrade: profile.grade,
    profileCountry: profile.country ?? null,
  });

  return eligible;
}
