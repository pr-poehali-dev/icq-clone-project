ALTER TABLE messages ADD COLUMN IF NOT EXISTS voice_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER;

ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS voice_url TEXT;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER;

CREATE TABLE IF NOT EXISTS user_reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL,
  reported_user_id INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (reported_user_id) REFERENCES users(id)
);

INSERT INTO users (username, password, avatar_url, bio, status, is_premium, created_at, last_seen, theme)
VALUES ('Snos', '122', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Snos', 'Администратор поддержки', 'online', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'dark')
ON CONFLICT DO NOTHING;

INSERT INTO users (username, password, avatar_url, bio, status, is_premium, created_at, last_seen, theme)
VALUES ('СНОС', '122', 'https://api.dicebear.com/7.x/bottts/svg?seed=SNOC', 'Только для премиум', 'online', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'dark')
ON CONFLICT DO NOTHING;