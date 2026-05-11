-- Per-shop travel packages (Аялал). A package is a multi-day tour
-- offering with its own gallery, headline spec strip, included /
-- excluded checklists, and a day-by-day itinerary.
--
-- Structure mirrors car_listings (own ad-style record) rather than
-- the lightweight catalog rows used by meat / menu / etc. — the
-- richer payload earns its own table.

CREATE TABLE travel_packages (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  -- Headline + commerce
  title TEXT NOT NULL,                -- e.g. "БАЛИ АРАЛ - Хөтөлбөртэй аялал"
  price TEXT,                          -- free text: "₩1,500,000" / "1500 USD"
  description TEXT,
  -- Quick-facts grid (6 items shown under the gallery on the detail page)
  duration TEXT,                       -- "6 өдөр, 5 шөнө"
  group_size TEXT,                     -- "10 хүн"
  transport TEXT,                      -- "Нисэх онгоц, Жуулчны автобус"
  accommodation TEXT,                  -- "4 одтой ресорт"
  guide TEXT,                          -- "Монгол хэлтэй хөтөч"
  tour_type TEXT,                      -- "Хөтөлбөртэй аялал" / "Чөлөөт"
  -- Checklists — JSON arrays of strings. JSON instead of side tables
  -- because the items are short, owner-typed, and only consumed as a
  -- list (no filtering / aggregation across packages).
  included_json TEXT,                  -- '["Хөтөлбөр бүсэн үзвэр", …]'
  excluded_json TEXT,                  -- '["Нислэгийн тийз", …]'
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'sold_out')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_travel_packages_shop_recent
  ON travel_packages(shop_id, created_at DESC);

CREATE TABLE travel_package_images (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL REFERENCES travel_packages(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_travel_package_images_pkg
  ON travel_package_images(package_id, sort_order);

-- Day-by-day itinerary. Each day is a title + description; the customer
-- detail page renders these as an accordion (Өдөр-1, Өдөр-2, …).
CREATE TABLE travel_package_days (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL REFERENCES travel_packages(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,         -- 1, 2, 3, …
  title TEXT NOT NULL,                 -- "Өдөр 1: Улаанбаатар-Бали"
  description TEXT,                    -- free-form body
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_travel_package_days_pkg
  ON travel_package_days(package_id, day_number);
