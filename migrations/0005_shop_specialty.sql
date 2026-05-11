-- Hospital subcategory (Эмнэлгийн төрөл).
--
-- Used today by hospital shops to drive the specialty tab filter on
-- /category/hospital. The owner picks one when registering. NULL for
-- every other category (and for legacy hospital rows that haven't
-- been edited yet — they'll just show up under "Бүгд").
--
-- Generic enough that other categories could opt in later (e.g.
-- restaurant cuisine type) without another migration.

ALTER TABLE shops ADD COLUMN specialty TEXT;
