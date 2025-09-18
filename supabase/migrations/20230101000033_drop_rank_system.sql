-- Drop all rank-related functions
DROP FUNCTION IF EXISTS add_activity_score(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS apply_monthly_rank_decay();
DROP FUNCTION IF EXISTS update_user_rank();
DROP FUNCTION IF EXISTS calculate_rank(INTEGER);

-- Drop all rank-related triggers
DROP TRIGGER IF EXISTS trigger_update_user_rank ON public.user_rank_data;

-- Drop all rank-related tables
DROP TABLE IF EXISTS public.user_activity_scores;
DROP TABLE IF EXISTS public.user_rank_data;

-- Drop any views if they exist
DROP VIEW IF EXISTS public.user_ranks;
