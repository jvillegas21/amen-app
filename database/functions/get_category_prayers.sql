-- ============================================================
-- Get Category Prayers Function
-- ============================================================
-- High-performance database function for category prayer discovery
-- Combines prayer data, user profiles, and interaction counts in ONE query
-- ============================================================
-- Performance: Reduces 3 queries to 1 query (67% improvement)
-- Before: Prayer query + Interactions query + Comments query
-- After: Single database function call
-- ============================================================

CREATE OR REPLACE FUNCTION get_category_prayers(
  category_id text,
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  prayer_id uuid,
  prayer_text text,
  user_id uuid,
  display_name text,
  avatar_url text,
  location_city text,
  created_at timestamptz,
  pray_count bigint,
  like_count bigint,
  save_count bigint,
  share_count bigint,
  comment_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as prayer_id,
    p.text as prayer_text,
    p.user_id,
    prof.display_name,
    prof.avatar_url,
    p.location_city,
    p.created_at,
    -- Use COUNT with FILTER for efficient aggregation
    COUNT(i.id) FILTER (WHERE i.type = 'PRAY') as pray_count,
    COUNT(i.id) FILTER (WHERE i.type = 'LIKE') as like_count,
    COUNT(i.id) FILTER (WHERE i.type = 'SAVE') as save_count,
    COUNT(i.id) FILTER (WHERE i.type = 'SHARE') as share_count,
    COUNT(c.id) as comment_count
  FROM prayers p
  -- Join user profile (INNER JOIN - prayers always have users)
  INNER JOIN profiles prof ON p.user_id = prof.id
  -- Join interactions (LEFT JOIN - prayers may have zero interactions)
  LEFT JOIN interactions i ON p.id = i.prayer_id
  -- Join comments (LEFT JOIN - prayers may have zero comments)
  LEFT JOIN comments c ON p.id = c.prayer_id
  -- Filter by category in tags array
  WHERE p.tags @> ARRAY[category_id]::text[]
    AND p.privacy_level = 'public'
  GROUP BY
    p.id,
    p.text,
    p.user_id,
    prof.display_name,
    prof.avatar_url,
    p.location_city,
    p.created_at
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function comments for documentation
COMMENT ON FUNCTION get_category_prayers(text, int, int) IS
  'Retrieves prayers for a specific category with aggregated interaction counts.
  Optimized for category discovery screen - combines multiple queries into one.

  Parameters:
    - category_id: Category ID to filter by (from tags array)
    - limit_count: Maximum number of prayers to return (default 50)
    - offset_count: Offset for pagination (default 0)

  Returns:
    - prayer_id, prayer_text, user data, and aggregated counts

  Example usage:
    SELECT * FROM get_category_prayers(''health_healing'', 50, 0);

  Performance:
    - Uses GIN index on tags for fast category filtering
    - Aggregates counts in single query instead of N+1 pattern
    - STABLE function can be cached by query planner';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_category_prayers(text, int, int) TO authenticated;

-- Test the function with a sample query
SELECT
  'Function created successfully!' as status,
  'Test with: SELECT * FROM get_category_prayers(''health_healing'', 10);' as test_query;

-- Example EXPLAIN ANALYZE to verify performance
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_category_prayers('health_healing', 50, 0);
