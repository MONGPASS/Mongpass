-- Banners can now optionally render a background photo (the admin
-- /admin/banner page already supports uploading one — we just hadn't
-- stored it in D1). Falls back to the gradient when null.

ALTER TABLE banners ADD COLUMN image_r2_key TEXT;
