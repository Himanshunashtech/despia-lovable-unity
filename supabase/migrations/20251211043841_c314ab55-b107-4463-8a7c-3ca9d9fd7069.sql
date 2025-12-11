-- Create storage bucket for food images
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view food images (public bucket)
CREATE POLICY "Anyone can view food images"
ON storage.objects FOR SELECT
USING (bucket_id = 'food-images');

-- Allow admins to upload food images
CREATE POLICY "Admins can upload food images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'food-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow anyone to view recipe images
CREATE POLICY "Anyone can view recipe images"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

-- Allow authenticated users to upload their own recipe images
CREATE POLICY "Users can upload recipe images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own recipe images
CREATE POLICY "Users can update their recipe images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'recipe-images' AND auth.role() = 'authenticated');

-- Allow users to delete their own recipe images
CREATE POLICY "Users can delete their recipe images"
ON storage.objects FOR DELETE
USING (bucket_id = 'recipe-images' AND auth.role() = 'authenticated');

-- Add image_url column to food_database if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'food_database' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.food_database ADD COLUMN image_url TEXT;
  END IF;
END $$;