-- ============================================================
-- Add Category Support to Prayers Table
-- ============================================================
-- Migration to add category field for prayer classification
-- Run this in Supabase SQL Editor after production_schema.sql
-- ============================================================

-- Add category column to prayers table
ALTER TABLE prayers
  ADD COLUMN IF NOT EXISTS category text;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_prayers_category
  ON prayers(category);

-- Add comment for documentation
COMMENT ON COLUMN prayers.category IS 'Prayer category for discovery and filtering (e.g., health_healing, spiritual_growth)';

-- Success message
SELECT 'Prayer category column added successfully!' as status;
