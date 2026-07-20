const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/cost_management.db');
console.log('数据库:', dbPath);

const db = new Database(dbPath);

// 1. oee_records 添加 cycle_time 列
const oeeCols = db.prepare('PRAGMA table_info(oee_records)').all();
if (!oeeCols.some(c => c.name === 'cycle_time')) {
  db.exec('ALTER TABLE oee_records ADD COLUMN cycle_time REAL DEFAULT 0');
  console.log('✅ oee_records 已添加 cycle_time 列');
} else {
  console.log('ℹ️ oee_records.cycle_time 已存在');
}

// 2. 创建 work_orders 表
db.exec(`
  CREATE TABLE IF NOT EXISTS work_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wo_no TEXT UNIQUE NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    plan_qty INTEGER DEFAULT 0,
    actual_qty INTEGER DEFAULT 0,
    defect_qty INTEGER DEFAULT 0,
    start_time DATETIME,
    end_time DATETIME,
    equipment_name TEXT,
    operator_name TEXT,
    status TEXT DEFAULT 'pending',
    material_cost REAL DEFAULT 0,
    labor_cost REAL DEFAULT 0,
    overhead_cost REAL DEFAULT 0,
    quality_cost REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    unit_cost REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✅ work_orders 表已就绪');

// 3. 创建 quality_inspections 表
db.exec(`
  CREATE TABLE IF NOT EXISTS quality_inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_no TEXT UNIQUE NOT NULL,
    wo_id INTEGER REFERENCES work_orders(id),
    order_id INTEGER REFERENCES orders(id),
    batch_no TEXT,
    inspect_type TEXT DEFAULT 'inline',
    sample_size INTEGER DEFAULT 0,
    defect_count INTEGER DEFAULT 0,
    pass_rate REAL DEFAULT 0,
    inspector_name TEXT,
    result TEXT DEFAULT 'pending',
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✅ quality_inspections 表已就绪');

db.close();
console.log('🎉 数据库迁移完成');
