-- Add onboarding tracking fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_weight_kg NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT 'maintain';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dietary_preference TEXT;

-- Add unique constraint to food_database
ALTER TABLE food_database ADD CONSTRAINT unique_food_brand UNIQUE (food_name, brand);

-- Seed nutrition database with common foods
INSERT INTO food_database (food_name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, verified, data_source) VALUES
('Apple', NULL, '100', 'g', 52, 0.3, 14, 0.2, 2.4, 1, true, 'usda'),
('Banana', NULL, '100', 'g', 89, 1.1, 23, 0.3, 2.6, 1, true, 'usda'),
('Chicken Breast (cooked)', NULL, '100', 'g', 165, 31, 0, 3.6, 0, 74, true, 'usda'),
('White Rice (cooked)', NULL, '100', 'g', 130, 2.7, 28, 0.3, 0.4, 1, true, 'usda'),
('Paneer', NULL, '100', 'g', 265, 18, 3.4, 20, 0, 18, true, 'usda'),
('Chapati', NULL, '1', 'piece', 71, 2.6, 15.7, 0.4, 2.7, 119, true, 'indian'),
('Dal (cooked)', NULL, '100', 'g', 116, 9, 20, 0.4, 7.9, 238, true, 'indian')
ON CONFLICT (food_name, brand) DO NOTHING;