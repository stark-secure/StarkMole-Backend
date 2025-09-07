-- Add indexes to improve query performance for common filters and aggregations
-- Run manually or integrate into your migration runner

-- Ensure users.email is indexed (unique constraint probably already exists)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Analytics frequent filters: event, timestamp, userId
CREATE INDEX IF NOT EXISTS idx_analytics_event_timestamp ON analytics_events(event, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_userid_timestamp ON analytics_events(user_id, timestamp DESC);

-- Audit logs: accelerate queries by user and date
CREATE INDEX IF NOT EXISTS idx_audit_userid_createdat ON audit_logs(user_id, created_at DESC);

-- Game sessions: ensure userId + createdAt exists (entity has index but keep as safety)
CREATE INDEX IF NOT EXISTS idx_game_sessions_userid_createdat ON game_sessions(user_id, created_at DESC);

-- Input events: gameSessionId + timestamp
CREATE INDEX IF NOT EXISTS idx_input_events_gamesessionid_timestamp ON input_events(game_session_id, timestamp DESC);

-- Badges join acceleration
CREATE INDEX IF NOT EXISTS idx_user_badges_userid ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badgeid ON user_badges(badge_id);

-- Optional: partial index for active analytics events (if most queries are for recent data)
CREATE INDEX IF NOT EXISTS idx_analytics_recent ON analytics_events(timestamp DESC) WHERE timestamp > now() - INTERVAL '30 days';
