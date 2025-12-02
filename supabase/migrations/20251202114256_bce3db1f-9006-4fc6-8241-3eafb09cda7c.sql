-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('bronze', 'silver', 'gold', 'platinum')),
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('streak', 'total_logs', 'perfect_week', 'water_goal', 'calorie_goal', 'exercise_count')),
  criteria_value INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Create user_stats table for tracking gamification metrics
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_food_logs INTEGER DEFAULT 0,
  total_water_logs INTEGER DEFAULT 0,
  total_exercise_logs INTEGER DEFAULT 0,
  perfect_weeks INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  last_log_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public readable)
CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_stats
CREATE POLICY "Users can view their own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to update user stats and check achievements
CREATE OR REPLACE FUNCTION public.update_user_stats_and_check_achievements(
  p_user_id UUID,
  p_log_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats RECORD;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_achievement RECORD;
BEGIN
  -- Get or create user stats
  SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;
  
  IF v_stats IS NULL THEN
    INSERT INTO user_stats (user_id, last_log_date)
    VALUES (p_user_id, v_today)
    RETURNING * INTO v_stats;
  END IF;

  -- Update streak
  IF v_stats.last_log_date IS NULL OR v_stats.last_log_date < v_yesterday THEN
    -- Reset streak if missed a day
    UPDATE user_stats
    SET current_streak = 1,
        last_log_date = v_today
    WHERE user_id = p_user_id;
  ELSIF v_stats.last_log_date = v_yesterday THEN
    -- Continue streak
    UPDATE user_stats
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_log_date = v_today
    WHERE user_id = p_user_id;
  END IF;

  -- Update log counts based on type
  IF p_log_type = 'food' THEN
    UPDATE user_stats SET total_food_logs = total_food_logs + 1 WHERE user_id = p_user_id;
  ELSIF p_log_type = 'water' THEN
    UPDATE user_stats SET total_water_logs = total_water_logs + 1 WHERE user_id = p_user_id;
  ELSIF p_log_type = 'exercise' THEN
    UPDATE user_stats SET total_exercise_logs = total_exercise_logs + 1 WHERE user_id = p_user_id;
  END IF;

  -- Refresh stats after updates
  SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;

  -- Check and award achievements
  FOR v_achievement IN 
    SELECT a.* FROM achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
    )
  LOOP
    -- Check if criteria is met
    IF (v_achievement.criteria_type = 'streak' AND v_stats.current_streak >= v_achievement.criteria_value) OR
       (v_achievement.criteria_type = 'total_logs' AND (v_stats.total_food_logs + v_stats.total_water_logs + v_stats.total_exercise_logs) >= v_achievement.criteria_value) OR
       (v_achievement.criteria_type = 'water_goal' AND v_stats.total_water_logs >= v_achievement.criteria_value) OR
       (v_achievement.criteria_type = 'exercise_count' AND v_stats.total_exercise_logs >= v_achievement.criteria_value) THEN
      
      -- Award achievement
      INSERT INTO user_achievements (user_id, achievement_id, progress)
      VALUES (p_user_id, v_achievement.id, v_achievement.criteria_value);
      
      -- Add points
      UPDATE user_stats SET total_points = total_points + v_achievement.points WHERE user_id = p_user_id;
    END IF;
  END LOOP;
END;
$$;