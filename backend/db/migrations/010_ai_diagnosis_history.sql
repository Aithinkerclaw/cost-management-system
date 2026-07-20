-- 010: AI诊断历史表
CREATE TABLE IF NOT EXISTS ai_diagnosis_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagnosed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  overall_score INTEGER,
  data_snapshot TEXT,  -- JSON字符串
  diagnoses TEXT,      -- JSON字符串
  suggestions TEXT,     -- JSON字符串
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SaaS: 给已有表补tenant_id字段（如果不存在）
-- SQLite不支持IF NOT EXISTS for ALTER TABLE, 所以用迁移方式处理
