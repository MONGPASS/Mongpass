-- User reports on content (posts, comments, reviews, shops). Drives
-- the /admin/reports moderation queue. One report per (user, target)
-- so a single person can't flood the queue about the same thing.
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL
    CHECK (target_type IN ('post', 'comment', 'review', 'shop')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_reports_status_recent ON reports(status, created_at DESC);
CREATE UNIQUE INDEX idx_reports_one_per_target
  ON reports(reporter_id, target_type, target_id);
