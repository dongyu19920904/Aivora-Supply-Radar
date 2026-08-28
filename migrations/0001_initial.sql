PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  product_type TEXT NOT NULL,
  aliases_json TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  feed_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'pending',
  source_score INTEGER NOT NULL DEFAULT 50,
  last_success_at TEXT,
  last_checked_at TEXT,
  last_error_code TEXT,
  is_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id),
  product_id INTEGER REFERENCES products(id),
  source_offer_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  image_url TEXT,
  price REAL,
  high_price REAL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  stock_status TEXT NOT NULL DEFAULT 'unknown',
  stock_count INTEGER,
  warranty TEXT NOT NULL DEFAULT 'unknown',
  delivery_type TEXT NOT NULL DEFAULT 'unknown',
  item_fingerprint TEXT NOT NULL,
  is_comparable INTEGER NOT NULL DEFAULT 1 CHECK (is_comparable IN (0, 1)),
  approved INTEGER NOT NULL DEFAULT 1 CHECK (approved IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  observed_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (merchant_id, source_offer_id)
);

CREATE TABLE IF NOT EXISTS offer_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  price REAL,
  high_price REAL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  stock_status TEXT NOT NULL,
  stock_count INTEGER,
  observed_at TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  UNIQUE (offer_id, fingerprint)
);

CREATE TABLE IF NOT EXISTS official_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  product_id INTEGER REFERENCES products(id),
  vendor TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'global',
  price REAL,
  currency TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  quota_text TEXT NOT NULL DEFAULT '',
  official_url TEXT NOT NULL,
  last_checked TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT NOT NULL,
  run_type TEXT NOT NULL,
  status TEXT NOT NULL,
  discovered_count INTEGER NOT NULL DEFAULT 0,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_date TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  body_markdown TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_sha TEXT,
  published_at TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunity_products (
  opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  match_reason TEXT NOT NULL,
  PRIMARY KEY (opportunity_id, product_id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reporter_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  review_note TEXT
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER UNIQUE REFERENCES submissions(id),
  title TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  author_name TEXT NOT NULL,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_visible_sort ON products(is_visible, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_offers_product_public ON offers(product_id, active, approved, stock_status, price);
CREATE INDEX IF NOT EXISTS idx_offers_merchant ON offers(merchant_id, active, updated_at);
CREATE INDEX IF NOT EXISTS idx_offer_snapshots_offer_time ON offer_snapshots(offer_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchants_visible_status ON merchants(is_visible, status, source_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_date ON opportunities(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status_time ON submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_runs_source_time ON source_runs(source_key, started_at DESC);
