-- Create enum for subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'lifetime');

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('user', 'admin');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Extend profiles table with subscription info
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS revenue_cat_user_id TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS weight_goal_kg NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS daily_water_goal_ml INTEGER DEFAULT 2000;

-- Create water_logs table
CREATE TABLE public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own water logs"
  ON public.water_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water logs"
  ON public.water_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create exercise_logs table
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercise logs"
  ON public.exercise_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise logs"
  ON public.exercise_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create weight_logs table
CREATE TABLE public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weight logs"
  ON public.weight_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight logs"
  ON public.weight_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight logs"
  ON public.weight_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Create comprehensive food_database table (for 1M+ items)
CREATE TABLE public.food_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT,
  food_name TEXT NOT NULL,
  brand TEXT,
  serving_size TEXT,
  serving_unit TEXT DEFAULT 'g',
  calories NUMERIC(8,2) NOT NULL,
  protein_g NUMERIC(6,2) DEFAULT 0,
  carbs_g NUMERIC(6,2) DEFAULT 0,
  fat_g NUMERIC(6,2) DEFAULT 0,
  fiber_g NUMERIC(6,2),
  sugar_g NUMERIC(6,2),
  sodium_mg NUMERIC(8,2),
  data_source TEXT DEFAULT 'user',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_food_database_barcode ON public.food_database(barcode);
CREATE INDEX idx_food_database_name ON public.food_database USING gin(to_tsvector('english', food_name));
CREATE INDEX idx_food_database_brand ON public.food_database USING gin(to_tsvector('english', brand));

ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read food database"
  ON public.food_database FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage food database"
  ON public.food_database FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add barcode field to food_logs
ALTER TABLE public.food_logs
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC(3,2);

-- Create trigger to auto-assign user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.water_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exercise_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weight_logs;