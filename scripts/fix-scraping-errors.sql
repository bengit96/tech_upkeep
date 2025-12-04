-- Fix Scraping Errors SQL Script
-- Run with: sqlite3 data/tech-upkeep.db < scripts/fix-scraping-errors.sql

BEGIN TRANSACTION;

-- 1. Fix techtrenches URL (remove utm parameters)
UPDATE sources
SET url = 'https://techtrenches.substack.com/feed',
    updated_at = unixepoch()
WHERE name = 'techtrenches';

-- 2. Fix Lenny's Podcast URL
UPDATE sources
SET url = 'https://www.lennyspodcast.com/feed',
    updated_at = unixepoch()
WHERE name = 'Lenny''s Podcast';

-- 3. Disable Medium sources with 403 errors (will fix in aggregator code)
UPDATE sources
SET is_active = 0,
    updated_at = unixepoch()
WHERE name IN ('Airbnb Engineering', 'Figma Engineering', 'Airwallex Engineering')
  AND is_active = 1;

-- 4. Disable Pragmatic Engineer Podcast (domain not found)
UPDATE sources
SET is_active = 0,
    updated_at = unixepoch()
WHERE name = 'Pragmatic Engineer Podcast'
  AND is_active = 1;

-- 5. Disable Level Up (404 error)
UPDATE sources
SET is_active = 0,
    updated_at = unixepoch()
WHERE name = 'Level Up Coding'
  AND is_active = 1;

COMMIT;

-- Show what was updated
SELECT
  name,
  url,
  is_active,
  datetime(updated_at, 'unixepoch') as last_updated
FROM sources
WHERE name IN (
  'techtrenches',
  'Lenny''s Podcast',
  'Airbnb Engineering',
  'Figma Engineering',
  'Airwallex Engineering',
  'Pragmatic Engineer Podcast',
  'Level Up Coding'
)
ORDER BY name;
