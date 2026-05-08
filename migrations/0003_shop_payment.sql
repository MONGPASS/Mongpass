-- Per-shop payment settings.
--
-- Used today by meat shops (their /biz/meat page exposes the inputs)
-- to drive a "transfer the total to this account" message on the
-- customer-facing order page. Other categories may opt in later
-- without further schema changes.
--
-- Columns:
--   bank_account — free-text "Bank · 110-XXX-XXXXXX · Holder Name".
--                  Stored as one line so we don't have to model bank
--                  + number + holder + memo separately for an MVP.
--   delivery_fee — KRW integer (0 = free shipping). NULL means "not
--                  configured yet" → order page hides the line.

ALTER TABLE shops ADD COLUMN bank_account TEXT;
ALTER TABLE shops ADD COLUMN delivery_fee INTEGER;
