-- Add meal templates table for saving frequent meals
CREATE TABLE public.meal_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL DEFAULT 'snack',
  total_calories NUMERIC DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,
  foods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on meal_templates
ALTER TABLE public.meal_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for meal_templates
CREATE POLICY "Users can view their own meal templates" ON public.meal_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own meal templates" ON public.meal_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meal templates" ON public.meal_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meal templates" ON public.meal_templates FOR DELETE USING (auth.uid() = user_id);

-- Add period/cycle tracking table for women's health
CREATE TABLE public.cycle_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  cycle_day INTEGER,
  period_start BOOLEAN DEFAULT false,
  period_end BOOLEAN DEFAULT false,
  flow_intensity TEXT, -- light, medium, heavy
  symptoms JSONB DEFAULT '[]'::jsonb,
  mood TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on cycle_logs
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for cycle_logs
CREATE POLICY "Users can view their own cycle logs" ON public.cycle_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own cycle logs" ON public.cycle_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cycle logs" ON public.cycle_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cycle logs" ON public.cycle_logs FOR DELETE USING (auth.uid() = user_id);

-- Add expert credentials table for self-declared badges
CREATE TABLE public.expert_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  credential_type TEXT NOT NULL, -- nutritionist, doctor, dietitian, fitness_coach
  credential_name TEXT NOT NULL,
  institution TEXT,
  year_obtained INTEGER,
  license_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on expert_credentials
ALTER TABLE public.expert_credentials ENABLE ROW LEVEL SECURITY;

-- RLS policies for expert_credentials
CREATE POLICY "Anyone can view verified credentials" ON public.expert_credentials FOR SELECT USING (true);
CREATE POLICY "Users can create their own credentials" ON public.expert_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credentials" ON public.expert_credentials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own credentials" ON public.expert_credentials FOR DELETE USING (auth.uid() = user_id);

-- Add columns to profiles for period tracking and accessibility preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS enable_period_tracking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS average_cycle_length INTEGER DEFAULT 28,
ADD COLUMN IF NOT EXISTS last_period_start DATE,
ADD COLUMN IF NOT EXISTS accessibility_large_text BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accessibility_high_contrast BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accessibility_reduce_motion BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX idx_meal_templates_user_id ON public.meal_templates(user_id);
CREATE INDEX idx_cycle_logs_user_id_date ON public.cycle_logs(user_id, date);
CREATE INDEX idx_expert_credentials_user_id ON public.expert_credentials(user_id);