-- Per-user upload accounting for rate limiting. Any signed-in account
-- could previously push 5 MB files into R2 without limit; /api/upload
-- now counts recent rows here before accepting. Rows older than the
-- largest window are swept opportunistically on each upload.
CREATE TABLE upload_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_upload_log_user_time ON upload_log(user_id, created_at DESC);
