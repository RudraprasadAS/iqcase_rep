
-- First, let's check what we have and fix the SLA matrix structure
-- Drop the existing table to recreate it properly
DROP TABLE IF EXISTS public.category_sla_matrix CASCADE;

-- Create the SLA matrix table with proper structure
CREATE TABLE public.category_sla_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.case_categories(id) ON DELETE CASCADE,
  sla_low INTEGER NOT NULL DEFAULT 96,      -- 4 days for low priority
  sla_medium INTEGER NOT NULL DEFAULT 48,   -- 2 days for medium priority  
  sla_high INTEGER NOT NULL DEFAULT 24,     -- 1 day for high priority
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category_id)  -- Each category should have only one SLA configuration
);

-- Enable RLS but make it accessible for now
ALTER TABLE public.category_sla_matrix ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read SLA matrix
CREATE POLICY "Allow authenticated users to view SLA matrix" 
ON public.category_sla_matrix FOR SELECT 
TO authenticated 
USING (true);

-- Now populate the SLA matrix with all existing categories
INSERT INTO public.category_sla_matrix (category_id, sla_low, sla_medium, sla_high)
SELECT 
  id,
  96 as sla_low,     -- 4 days
  48 as sla_medium,  -- 2 days
  24 as sla_high     -- 1 day
FROM public.case_categories 
WHERE is_active = true
ON CONFLICT (category_id) DO NOTHING;

-- Create trigger to automatically add SLA matrix when new categories are created
CREATE OR REPLACE FUNCTION public.create_sla_matrix_for_category()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.category_sla_matrix (category_id, sla_low, sla_medium, sla_high)
  VALUES (NEW.id, 96, 48, 24)
  ON CONFLICT (category_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_sla_matrix 
  AFTER INSERT ON public.case_categories
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_sla_matrix_for_category();
