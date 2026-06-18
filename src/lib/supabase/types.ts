/**
 * Hand-written DB types matching the Mentoria Hub schema.
 * Regenerate with: npm run db:types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enum helpers ────────────────────────────────────────────────────────────

export type Locale = "ru" | "en" | "kk";
export type UserRole = "student" | "mentor" | "admin";
export type OpportunityType =
  | "olympiad"
  | "competition"
  | "hackathon"
  | "scholarship"
  | "internship"
  | "research"
  | "summer_school"
  | "volunteering"
  | "other";
export type Format = "online" | "offline" | "hybrid";
export type ContentStatus = "draft" | "published" | "archived";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type LessonStatus = "not_started" | "in_progress" | "completed";
export type RoadmapStepKind = "opportunity" | "course" | "action";
export type RoadmapStepStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "done";
export type DeadlineSourceType = "opportunity" | "roadmap_step" | "custom";
export type NotificationKind =
  | "digest"
  | "deadline"
  | "system"
  | "achievement";
export type Term = "fall" | "spring" | "summer";

// ─── Row types ────────────────────────────────────────────────────────────────

export interface ProfileRow {
  id: string;
  full_name: string | null;
  grade: number | null;
  locale: Locale;
  country: string | null;
  city: string | null;
  goal: string | null;
  target_majors: string[];
  interests: string[];
  subjects: string[];
  profile_vector: string | null; // vector(1536) — stored as a stringified array by PostgREST
  onboarding_completed: boolean;
  xp: number;
  streak_count: number;
  streak_last_active: string | null; // date as ISO string
  calendar_token: string;
  email_optin: boolean;
  digest_optin: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  name_kk: string;
  accent_color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface TagRow {
  id: string;
  slug: string;
  label: string;
  kind: "subject" | "format" | "level" | "goal" | "region";
  created_at: string;
  updated_at: string;
}

export interface OpportunityRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  category_id: string | null;
  type: OpportunityType;
  format: Format | null;
  min_grade: number | null;
  max_grade: number | null;
  region: string | null;
  deadline: string | null;
  apply_url: string | null;
  source: string | null;
  source_raw: string | null;
  tags: string[];
  embedding: string | null; // vector(1536) — stored as a stringified array by PostgREST
  search_vector: string | null; // tsvector generated column — for FTS via .textSearch()
  status: ContentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedOpportunityRow {
  id: string;
  user_id: string;
  opportunity_id: string;
  created_at: string;
  updated_at: string;
}

export interface CourseRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: CourseLevel;
  category_id: string | null;
  cover_color: string | null;
  estimated_minutes: number | null;
  tags: string[];
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface ModuleRow {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface LessonRow {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
  content: Json;
  video_url: string | null;
  materials: Json | null;
  created_at: string;
  updated_at: string;
}

export interface QuizRow {
  id: string;
  lesson_id: string;
  questions: Json;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
}

export interface LessonProgressRow {
  id: string;
  user_id: string;
  lesson_id: string;
  status: LessonStatus;
  quiz_score: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoadmapRow {
  id: string;
  user_id: string;
  goal_snapshot: string;
  generated_at: string;
  model: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface RoadmapStepRow {
  id: string;
  roadmap_id: string;
  grade: number;
  term: Term | null;
  order_index: number;
  title: string;
  rationale: string;
  kind: RoadmapStepKind;
  opportunity_id: string | null;
  course_id: string | null;
  deadline: string | null;
  status: RoadmapStepStatus;
  match_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface DeadlineRow {
  id: string;
  user_id: string;
  source_type: DeadlineSourceType;
  source_id: string | null;
  title: string;
  due_at: string;
  remind_14d_sent: boolean;
  remind_2d_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  keys: Json;
  created_at: string;
  updated_at: string;
}

export interface CertificateRow {
  id: string;
  user_id: string;
  course_id: string;
  serial: string;
  share_token: string; // uuid — stable public share URL key
  student_name: string; // snapshot at issue time
  course_title: string; // snapshot at issue time
  completion_date: string; // ISO date string (YYYY-MM-DD)
  issued_at: string;
  created_at: string;
  updated_at: string;
}

export interface XpEventRow {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface MentorRow {
  id: string; // refs profiles.id
  bio: string | null;
  specialties: string[];
  created_at: string;
  updated_at: string;
}

export type MentorMessageRole = "user" | "assistant";

export interface MentorMessageRow {
  id: string;
  user_id: string;
  role: MentorMessageRole;
  content: string;
  created_at: string;
}

export type MentorMessageInsert = Omit<MentorMessageRow, "id" | "created_at">;

// ─── Insert types (omit server-generated fields) ─────────────────────────────

export type ProfileInsert = Omit<ProfileRow, "created_at" | "updated_at">;
export type CategoryInsert = Omit<CategoryRow, "id" | "created_at" | "updated_at">;
export type OpportunityInsert = Omit<OpportunityRow, "id" | "created_at" | "updated_at" | "search_vector">;
export type CourseInsert = Omit<CourseRow, "id" | "created_at" | "updated_at">;
export type ModuleInsert = Omit<ModuleRow, "id" | "created_at" | "updated_at">;
export type LessonInsert = Omit<LessonRow, "id" | "created_at" | "updated_at">;
export type EnrollmentInsert = Pick<EnrollmentRow, "user_id" | "course_id">;
export type LessonProgressInsert = Pick<LessonProgressRow, "user_id" | "lesson_id" | "status" | "quiz_score" | "completed_at">;

// ─── Supabase Database type (used by createClient generics) ──────────────────
//
// Each table entry MUST include `Relationships: []` so that the type satisfies
// the `GenericTable` constraint from @supabase/postgrest-js, which requires it.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, "id">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: Omit<CategoryRow, "id" | "created_at" | "updated_at">;
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      tags: {
        Row: TagRow;
        Insert: Omit<TagRow, "id" | "created_at" | "updated_at">;
        Update: Partial<TagRow>;
        Relationships: [];
      };
      opportunities: {
        Row: OpportunityRow;
        Insert: Omit<OpportunityRow, "id" | "created_at" | "updated_at" | "search_vector">;
        Update: Partial<Omit<OpportunityRow, "search_vector">>;
        Relationships: [];
      };
      saved_opportunities: {
        Row: SavedOpportunityRow;
        Insert: Omit<SavedOpportunityRow, "id" | "created_at" | "updated_at">;
        Update: Partial<SavedOpportunityRow>;
        Relationships: [];
      };
      courses: {
        Row: CourseRow;
        Insert: Omit<CourseRow, "id" | "created_at" | "updated_at">;
        Update: Partial<CourseRow>;
        Relationships: [];
      };
      modules: {
        Row: ModuleRow;
        Insert: Omit<ModuleRow, "id" | "created_at" | "updated_at">;
        Update: Partial<ModuleRow>;
        Relationships: [];
      };
      lessons: {
        Row: LessonRow;
        Insert: Omit<LessonRow, "id" | "created_at" | "updated_at">;
        Update: Partial<LessonRow>;
        Relationships: [];
      };
      quizzes: {
        Row: QuizRow;
        Insert: Omit<QuizRow, "id" | "created_at" | "updated_at">;
        Update: Partial<QuizRow>;
        Relationships: [];
      };
      enrollments: {
        Row: EnrollmentRow;
        Insert: Omit<EnrollmentRow, "id" | "created_at" | "updated_at">;
        Update: Partial<EnrollmentRow>;
        Relationships: [];
      };
      lesson_progress: {
        Row: LessonProgressRow;
        Insert: Omit<LessonProgressRow, "id" | "created_at" | "updated_at">;
        Update: Partial<LessonProgressRow>;
        Relationships: [];
      };
      roadmaps: {
        Row: RoadmapRow;
        Insert: Omit<RoadmapRow, "id" | "created_at" | "updated_at">;
        Update: Partial<RoadmapRow>;
        Relationships: [];
      };
      roadmap_steps: {
        Row: RoadmapStepRow;
        Insert: Omit<RoadmapStepRow, "id" | "created_at" | "updated_at">;
        Update: Partial<RoadmapStepRow>;
        Relationships: [];
      };
      deadlines: {
        Row: DeadlineRow;
        Insert: Omit<DeadlineRow, "id" | "created_at" | "updated_at">;
        Update: Partial<DeadlineRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, "id" | "created_at">;
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: Omit<PushSubscriptionRow, "id" | "created_at" | "updated_at">;
        Update: Partial<PushSubscriptionRow>;
        Relationships: [];
      };
      certificates: {
        Row: CertificateRow;
        Insert: Omit<CertificateRow, "id" | "created_at" | "updated_at">;
        Update: Partial<CertificateRow>;
        Relationships: [];
      };
      xp_events: {
        Row: XpEventRow;
        Insert: Omit<XpEventRow, "id" | "created_at">;
        Update: Partial<XpEventRow>;
        Relationships: [];
      };
      mentors: {
        Row: MentorRow;
        Insert: Omit<MentorRow, "created_at" | "updated_at">;
        Update: Partial<MentorRow>;
        Relationships: [];
      };
      mentor_messages: {
        Row: MentorMessageRow;
        Insert: MentorMessageInsert;
        Update: Partial<MentorMessageRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_opportunities: {
        Args: {
          p_vector: string;
          p_ids: string[];
          p_limit?: number;
        };
        Returns: Array<{
          id: string;
          similarity: number;
        }>;
      };
      weekly_leaderboard: {
        Args: Record<string, never>;
        Returns: Array<{
          user_id: string;
          display_name: string;
          weekly_xp: number;
          rank: number;
        }>;
      };
    };
    Enums: Record<string, never>;
  };
}
