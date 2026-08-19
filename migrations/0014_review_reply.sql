-- One owner reply per review — the marketplace convention. The shop
-- (or an admin) can set, edit, or clear it; kept as columns rather
-- than a table because there is never more than one reply and it
-- lives or dies with its review.
ALTER TABLE reviews ADD COLUMN reply TEXT;
ALTER TABLE reviews ADD COLUMN reply_at TEXT;
