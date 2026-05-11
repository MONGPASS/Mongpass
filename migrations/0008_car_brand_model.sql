-- Split car listing headline into brand + model so the /biz/car form
-- can offer a brand dropdown instead of asking the owner to type the
-- full title.
--
-- The existing `title` column stays NOT NULL — we keep deriving it
-- from `${brand} ${model}` on the write path so older read-sites
-- that still reference `title` keep working.

ALTER TABLE car_listings ADD COLUMN brand TEXT;
ALTER TABLE car_listings ADD COLUMN model TEXT;
