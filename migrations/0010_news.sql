-- Editorial news articles, published by admins only and shown in a
-- "Мэдээ" feed on the home page + a dedicated /news/<id> detail page.
--
-- Separate from community_posts because:
--  - access control differs (admin-only writes vs. any-authed user)
--  - schema is richer (hero image, multiple tags, draft lifecycle)
--  - the surface is one-way editorial, not back-and-forth chat
--
-- Likes use the same composite-PK pattern as community_post_likes so
-- the toggle endpoint can be a single INSERT OR IGNORE / DELETE.

CREATE TABLE news_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_r2_key TEXT,
  -- Free-form tag set, JSON array of strings ('["Онцгой", "Санал"]').
  -- Stored as JSON instead of a side table because the count is small,
  -- editing is replace-all, and we never filter across articles by tag.
  tags_json TEXT,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published')),
  -- Author id captured for audit; not exposed on the customer side
  -- (articles look "from MongPass", not from a specific admin).
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_news_articles_published_recent
  ON news_articles(status, created_at DESC);

CREATE TABLE news_article_likes (
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (article_id, user_id)
);
CREATE INDEX idx_news_article_likes_article
  ON news_article_likes(article_id);
