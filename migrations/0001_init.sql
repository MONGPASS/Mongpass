-- 0001_init.sql — MongPass initial schema
-- Cloudflare D1 (SQLite). String IDs, ISO TEXT timestamps.
-- Foreign keys declared for documentation; D1 currently does not enforce
-- them, but the app code respects them.

-- ==================== Identity ====================

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  banned INTEGER NOT NULL DEFAULT 0,
  banned_reason TEXT,
  banned_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_email ON users(email);

-- Session store (hand-rolled, oslojs-based — see src/lib/auth/session.ts)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,                    -- SHA-256 hash of the token (hex)
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL             -- Unix ms
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- OAuth provider linkage (Google for now; structure permits more later)
CREATE TABLE oauth_accounts (
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (provider, provider_user_id)
);
CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);

-- ==================== Shops ====================

CREATE TABLE shops (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,                 -- ShopCategory union (cargo|restaurant|…)
  name TEXT NOT NULL,
  description TEXT,
  contact_phone TEXT,
  address TEXT,
  open_hours TEXT,
  facebook TEXT,
  instagram TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_at TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  is_open INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_shops_owner ON shops(owner_id);
CREATE INDEX idx_shops_status ON shops(status);
CREATE INDEX idx_shops_category ON shops(category);

CREATE TABLE shop_images (
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (shop_id, r2_key)
);
CREATE INDEX idx_shop_images_order ON shop_images(shop_id, sort_order);

CREATE TABLE shop_notices (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_shop_notices_recent ON shop_notices(shop_id, created_at DESC);

-- ==================== Per-shop catalogs ====================
-- These replace the global localStorage stores from the demo. Every row is
-- scoped to a single shop, fixing the multi-tenant bug from Option A.

CREATE TABLE cargo_routes (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('air', 'express', 'regular')),
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  price_per_kg TEXT NOT NULL,
  transit_days TEXT NOT NULL,
  schedule TEXT
);
CREATE INDEX idx_cargo_routes_shop ON cargo_routes(shop_id);

CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL
);
CREATE INDEX idx_menu_items_shop ON menu_items(shop_id);

CREATE TABLE doctors (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  specialty TEXT,
  bio TEXT,
  image_r2_key TEXT
);
CREATE INDEX idx_doctors_shop ON doctors(shop_id);

CREATE TABLE beauty_services (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  price TEXT NOT NULL
);
CREATE INDEX idx_beauty_services_shop ON beauty_services(shop_id);

CREATE TABLE beauty_stylists (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  image_r2_key TEXT
);
CREATE INDEX idx_beauty_stylists_shop ON beauty_stylists(shop_id);

CREATE TABLE meat_products (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  unit TEXT NOT NULL,
  image_r2_key TEXT
);
CREATE INDEX idx_meat_products_shop ON meat_products(shop_id);

-- ==================== Transactions ====================

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'received', 'in_transit', 'delivered', 'cancelled')),
  status_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  payload_json TEXT NOT NULL              -- discriminated-union body
);
CREATE INDEX idx_orders_shop_recent ON orders(shop_id, created_at DESC);
CREATE INDEX idx_orders_customer_recent ON orders(customer_user_id, created_at DESC);
CREATE INDEX idx_orders_category_status ON orders(category, status);

-- ==================== Engagement ====================

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,                -- snapshot at write time
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_reviews_shop_recent ON reviews(shop_id, created_at DESC);

CREATE TABLE favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, shop_id)
);
CREATE INDEX idx_favorites_user_recent ON favorites(user_id, created_at DESC);

CREATE TABLE recently_viewed (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, shop_id)
);
CREATE INDEX idx_recently_viewed_user_recent ON recently_viewed(user_id, viewed_at DESC);

CREATE TABLE notifications_seen (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen_at TEXT NOT NULL
);

-- ==================== Communication ====================

CREATE TABLE chat_threads (
  id TEXT PRIMARY KEY,                    -- format: "{user_id}:{shop_id}"
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_message_preview TEXT
);
CREATE INDEX idx_chat_threads_user_recent ON chat_threads(user_id, last_message_at DESC);
CREATE INDEX idx_chat_threads_shop_recent ON chat_threads(shop_id, last_message_at DESC);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'shop')),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_chat_messages_thread_recent ON chat_messages(thread_id, created_at);

-- ==================== Community ====================

CREATE TABLE community_posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_r2_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_community_posts_recent ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_category_recent
  ON community_posts(category, created_at DESC);

CREATE TABLE community_post_likes (
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE community_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_community_comments_post_recent
  ON community_comments(post_id, created_at);

-- ==================== Misc ====================

CREATE TABLE banners (
  id TEXT PRIMARY KEY,
  badge TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  gradient TEXT NOT NULL
    CHECK (gradient IN ('blue', 'purple', 'orange', 'emerald', 'pink', 'slate')),
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_banners_order ON banners(sort_order);
