-- Web Push subscriptions. One row per (browser, user) push endpoint;
-- endpoint URLs are unique per subscription so they serve as the PK.
-- p256dh/auth are stored for future encrypted-payload pushes — today
-- we send payload-less pings and the service worker fetches what to
-- display, which needs no message encryption.
CREATE TABLE push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
