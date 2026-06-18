-- ============================================================
-- Mentoria Hub — seed data
-- Applied via Supabase MCP on 2026-06-16.
-- Run again with: supabase db reset (will also replay migrations)
-- ============================================================

-- 6 Categories (matching DESIGN_SYSTEM §1.2 accent palette)
insert into public.categories (slug, name_en, name_ru, name_kk, accent_color, icon) values
  ('business',      'Business',      'Бизнес',          'Бизнес',           '#FF9600', 'briefcase'),
  ('stem',          'STEM',          'STEM',             'STEM',             '#2B70C9', 'flask-conical'),
  ('social-impact', 'Social Impact', 'Социальный вклад', 'Әлеуметтік әсер',  '#14B8A6', 'heart-handshake'),
  ('finance',       'Finance',       'Финансы',          'Қаржы',            '#FFC800', 'coins'),
  ('programming',   'Programming',   'Программирование', 'Бағдарламалау',    '#1CB0F6', 'code-2'),
  ('science',       'Science',       'Наука',            'Ғылым',            '#CE82FF', 'atom')
on conflict (slug) do nothing;

-- 12 Opportunities + 3 Courses with modules/lessons/quizzes
-- (inserted via MCP seed session — see project Supabase dashboard for full data)
-- Re-run the DO $seed$ block from the MCP session to repopulate if needed.
