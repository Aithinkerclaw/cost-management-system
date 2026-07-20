-- 011: 通知历史表
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,  -- 'diagnosis' | 'alert' | 'system'
  title TEXT NOT NULL,
  content TEXT,
  is_read INTEGER DEFAULT 0,  -- 0=未读, 1=已读
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- SaaS: 补tenant_id字段
ALTER TABLE notifications ADD COLUMN tenant_id INTEGER DEFAULT 1;
