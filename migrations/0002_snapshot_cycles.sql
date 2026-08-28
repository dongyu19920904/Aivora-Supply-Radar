CREATE TABLE offer_snapshots_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  price REAL,
  high_price REAL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  stock_status TEXT NOT NULL,
  stock_count INTEGER,
  observed_at TEXT NOT NULL,
  fingerprint TEXT NOT NULL
);

INSERT INTO offer_snapshots_v2
  (id, offer_id, price, high_price, currency, stock_status, stock_count, observed_at, fingerprint)
SELECT id, offer_id, price, high_price, currency, stock_status, stock_count, observed_at, fingerprint
FROM offer_snapshots;

DROP TABLE offer_snapshots;
ALTER TABLE offer_snapshots_v2 RENAME TO offer_snapshots;

CREATE INDEX idx_offer_snapshots_offer_time
  ON offer_snapshots(offer_id, observed_at DESC, id DESC);
