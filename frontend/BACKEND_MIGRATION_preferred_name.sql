-- ============================================
-- PREFERRED NAME FEATURE - DATABASE MIGRATION
-- ============================================
-- Database: notaku_db
-- Server: 172.16.1.7
-- User: notaku_user
-- Date: 2025-10-26
-- ============================================

-- Step 1: Add preferred_name column to users table
ALTER TABLE users ADD COLUMN preferred_name VARCHAR(100);

-- Step 2: Set default values for existing users
-- Extract first name from full_name for existing users
UPDATE users 
SET preferred_name = SPLIT_PART(full_name, ' ', 1) 
WHERE full_name IS NOT NULL 
  AND full_name != '' 
  AND preferred_name IS NULL;

-- For users without full_name, use username as fallback
UPDATE users 
SET preferred_name = username 
WHERE preferred_name IS NULL;

-- Step 3: Add index for performance (optional but recommended)
CREATE INDEX idx_users_preferred_name ON users(preferred_name);

-- Step 4: Verify migration
SELECT 
    id,
    username,
    full_name,
    preferred_name,
    CASE 
        WHEN preferred_name IS NULL THEN '❌ NULL'
        WHEN preferred_name = '' THEN '⚠️ EMPTY'
        ELSE '✅ SET'
    END as status
FROM users
LIMIT 10;

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
-- DROP INDEX idx_users_preferred_name;
-- ALTER TABLE users DROP COLUMN preferred_name;

-- ============================================
-- TESTING QUERIES
-- ============================================

-- Check all users have preferred_name set
SELECT COUNT(*) as total_users,
       COUNT(preferred_name) as users_with_preferred_name,
       COUNT(*) - COUNT(preferred_name) as users_without_preferred_name
FROM users;

-- View sample data
SELECT username, full_name, preferred_name 
FROM users 
ORDER BY created_at DESC 
LIMIT 20;

-- ============================================
-- NOTES
-- ============================================
-- 1. preferred_name is nullable (optional field)
-- 2. No unique constraint (multiple users can have same preferred name)
-- 3. Max length: 100 characters
-- 4. Used for display in chat AI, not for authentication
-- 5. Fallback order: preferred_name → first word of full_name → username
-- ============================================
