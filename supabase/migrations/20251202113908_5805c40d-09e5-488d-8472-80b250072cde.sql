-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  meal_reminders BOOLEAN DEFAULT true,
  water_reminders BOOLEAN DEFAULT true,
  exercise_reminders BOOLEAN DEFAULT true,
  weight_log_reminders BOOLEAN DEFAULT false,
  breakfast_time TIME DEFAULT '08:00',
  lunch_time TIME DEFAULT '12:00',
  dinner_time TIME DEFAULT '18:00',
  snack_time TIME DEFAULT '15:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER DEFAULT 1,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  total_calories NUMERIC DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,
  instructions TEXT,
  image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create recipe_ingredients table
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity TEXT,
  serving_size TEXT,
  calories NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create barcode_history table for quick re-scanning
CREATE TABLE IF NOT EXISTS public.barcode_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  barcode TEXT NOT NULL,
  food_name TEXT NOT NULL,
  brand TEXT,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  serving_size TEXT,
  last_scanned_at TIMESTAMPTZ DEFAULT now(),
  scan_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  food_database_id UUID REFERENCES public.food_database(id) ON DELETE SET NULL,
  custom_food_name TEXT,
  planned_calories NUMERIC DEFAULT 0,
  planned_protein NUMERIC DEFAULT 0,
  planned_carbs NUMERIC DEFAULT 0,
  planned_fat NUMERIC DEFAULT 0,
  is_logged BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for notification_settings
CREATE POLICY "Users can view their own notification settings"
  ON public.notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON public.notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON public.notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for recipes
CREATE POLICY "Users can view public recipes and their own recipes"
  ON public.recipes FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON public.recipes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for recipe_ingredients
CREATE POLICY "Users can view ingredients of accessible recipes"
  ON public.recipe_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND (recipes.is_public = true OR recipes.user_id = auth.uid())
  ));

CREATE POLICY "Users can insert ingredients for their own recipes"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can update ingredients of their own recipes"
  ON public.recipe_ingredients FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete ingredients from their own recipes"
  ON public.recipe_ingredients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  ));

-- RLS Policies for barcode_history
CREATE POLICY "Users can view their own barcode history"
  ON public.barcode_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own barcode history"
  ON public.barcode_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own barcode history"
  ON public.barcode_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own barcode history"
  ON public.barcode_history FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meal_plans
CREATE POLICY "Users can view their own meal plans"
  ON public.meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans"
  ON public.meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON public.meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
  ON public.meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_public ON public.recipes(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_barcode_history_user_id ON public.barcode_history(user_id);
CREATE INDEX IF NOT EXISTS idx_barcode_history_barcode ON public.barcode_history(barcode);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON public.meal_plans(user_id, date);

-- Add updated_at triggers
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();