-- News articles get a structured category (one per article) so the
-- customer-facing /news page can offer a tab filter and the admin
-- list can group articles by section.
--
-- Free-form tags stay (`tags_json`) — they're for fine-grained labels
-- like "#Онцгой" / "#Санал болгох" within a category. Category is
-- the coarser bucket.

ALTER TABLE news_articles ADD COLUMN category TEXT;
CREATE INDEX idx_news_articles_category_recent
  ON news_articles(category, created_at DESC);
