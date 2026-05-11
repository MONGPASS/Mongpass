-- Per-shop used-car listings. A car listing is a full "ad" — its own
-- title, price, gallery, spec table, and description — far richer
-- than the meat_products / menu_items row shape. So it gets its own
-- table rather than living inside the generic catalog model.
--
-- All spec columns are TEXT (free-text) so owners can write
-- "1.5 л" / "1500 cc" / "2.0 turbo" / "120 hp" without us locking
-- them into a value set we'd have to maintain.

CREATE TABLE car_listings (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  -- Headline + commerce
  title TEXT NOT NULL,
  price TEXT,                 -- free text: "18 сая ₮" / "₩18,000,000"
  description TEXT,
  location TEXT,
  -- Spec table (every field optional, free text)
  engine_capacity TEXT,       -- Мотор багтаамж
  transmission TEXT,          -- Хурдны хайрцаг
  steering TEXT,              -- Хурд (right/left)
  body_type TEXT,             -- Төрөл (sedan/SUV/...)
  exterior_color TEXT,        -- Өнгө
  year_manufactured TEXT,     -- Үйлдвэрлэсэн он
  year_imported TEXT,         -- Орж ирсэн он
  engine_type TEXT,           -- Хөдөлгүүр (бензин/дизель/гибрид/цахилгаан)
  interior_color TEXT,        -- Дотор өнгө
  leasing TEXT,               -- Лизинг (тийм/үгүй)
  drive TEXT,                 -- Хөтлөгч (FF/FR/AWD/4WD)
  mileage TEXT,               -- Явсан (km)
  condition TEXT,             -- Нөхцөл
  doors TEXT,                 -- Хаалга (count)
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'sold')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_car_listings_shop_recent
  ON car_listings(shop_id, created_at DESC);

CREATE TABLE car_listing_images (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES car_listings(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_car_listing_images_listing
  ON car_listing_images(listing_id, sort_order);
