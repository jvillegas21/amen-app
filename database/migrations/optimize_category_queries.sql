-- ============================================================
-- Optimize Category Prayer Queries
-- ============================================================
-- Migration to add compound index for improved category discovery performance
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add partial index for public prayers with tags (most common query pattern)
-- This optimizes the CategoryPrayersScreen query:
-- SELECT * FROM prayers WHERE tags @> ARRAY['category_id'] AND privacy_level = 'public'
CREATE INDEX IF NOT EXISTS idx_prayers_tags_public_created
  ON prayers USING GIN(tags)
  WHERE privacy_level = 'public';

-- Add comment for documentation
COMMENT ON INDEX idx_prayers_tags_public_created IS
  'Optimizes category discovery queries filtering by tags and public privacy level.
  Partial index reduces size by only indexing public prayers.';

-- Analyze the table to update query planner statistics
ANALYZE prayers;

-- Verify index usage with sample query
-- This should show "Index Scan using idx_prayers_tags_public_created"
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, text, user_id, location_city, created_at
FROM prayers
WHERE tags @> ARRAY['health_healing']::text[]
  AND privacy_level = 'public'
ORDER BY created_at DESC
LIMIT 50;

-- Success message
SELECT 'Category query optimization complete!' as status,
       'Run EXPLAIN ANALYZE on category queries to verify index usage' as next_step;
