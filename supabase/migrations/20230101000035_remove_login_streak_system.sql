-- Drop login streak functions and triggers
DROP FUNCTION IF EXISTS update_login_streak() CASCADE;
DROP FUNCTION IF EXISTS record_user_login(UUID) CASCADE;

-- Drop login streak tables
DROP TABLE IF EXISTS public.login_streaks CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.available_badges CASCADE;
