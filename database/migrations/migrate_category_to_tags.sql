-- ============================================================
-- Migrate Category Data to Tags Array
-- ============================================================
-- Migration to synchronize category column with tags array
-- This ensures backward compatibility while moving to tags-based approach
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Migrate existing category values to tags array
-- Only updates prayers that have a category but it's not in tags yet
UPDATE prayers
SET tags = CASE
  WHEN category IS NOT NULL AND category != '' THEN
    -- Add category to tags if not already present
    CASE
      WHEN NOT (tags @> ARRAY[category]::text[]) THEN array_append(tags, category)
      ELSE tags
    END
  ELSE tags
END
WHERE category IS NOT NULL
  AND category != ''
  AND NOT (tags @> ARRAY[category]::text[]);

-- Step 2: Create trigger to keep category and tags synchronized
-- This ensures that if category is set, it's always in tags
CREATE OR REPLACE FUNCTION sync_category_to_tags()
RETURNS TRIGGER AS $$
BEGIN
  -- If category is set, ensure it's in tags array
  IF NEW.category IS NOT NULL AND NEW.category != '' THEN
    -- Only add if not already present
    IF NOT (NEW.tags @> ARRAY[NEW.category]::text[]) THEN
      NEW.tags := array_append(COALESCE(NEW.tags, ARRAY[]::text[]), NEW.category);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS ensure_category_in_tags ON prayers;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER ensure_category_in_tags
  BEFORE INSERT OR UPDATE ON prayers
  FOR EACH ROW
  EXECUTE FUNCTION sync_category_to_tags();

-- Add comment for documentation
COMMENT ON FUNCTION sync_category_to_tags() IS
  'Automatically synchronizes category column with tags array.
  Ensures category is always present in tags for backward compatibility.
  Future: Consider deprecating category column and using tags exclusively.';

-- Verify migration
SELECT
  COUNT(*) as total_prayers,
  COUNT(*) FILTER (WHERE category IS NOT NULL) as prayers_with_category,
  COUNT(*) FILTER (WHERE tags IS NOT NULL AND array_length(tags, 1) > 0) as prayers_with_tags,
  COUNT(*) FILTER (WHERE category IS NOT NULL AND tags @> ARRAY[category]::text[]) as synchronized_prayers
FROM prayers;

-- Success message
SELECT 'Category to tags migration complete!' as status,
       'Category column is now synchronized with tags array via trigger' as note;
