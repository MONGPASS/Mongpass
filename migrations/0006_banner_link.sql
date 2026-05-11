-- Hero banners can now carry a destination URL so clicking the
-- artwork sends the customer to a promo page / category list / shop
-- detail / external partner. NULL means non-clickable (decorative
-- banner only), matching today's default behaviour.

ALTER TABLE banners ADD COLUMN link_url TEXT;
