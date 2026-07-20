const Database = require('better-sqlite3');
const path = require('path');
const { isSaaS } = require('./index');

const DB_PATH = path.join(__dirname, '../../data/cost_management.db');
let db;

function initDatabase() {
  const fs = require('fs');
  const path = require('path');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ====== 基础业务表 SQL ======
  const baseTables = `
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name TEXT,
      role TEXT DEFAULT 'staff',
      role_code TEXT DEFAULT 'staff',
      department TEXT,
      phone TEXT,
      avatar_url TEXT,
      status INTEGER DEFAULT 1,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 角色表（全局共享）
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_code TEXT UNIQUE NOT NULL,
      role_name TEXT NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 角色权限表（全局共享）
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_code TEXT NOT NULL,
      module_code TEXT NOT NULL,
      access_level TEXT NOT NULL DEFAULT 'none',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role_code, module_code)
    );
  `;

  // 业务表（SaaS 模式加 tenant_id）
  const businessTables = `
    -- 产品表
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_code TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT,
      unit TEXT DEFAULT '件',
      standard_cost REAL DEFAULT 0,
      target_cost REAL DEFAULT 0,
      target_price REAL DEFAULT 0,
      target_margin REAL DEFAULT 0,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- BOM明细
    CREATE TABLE IF NOT EXISTS bom_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id),
      material_id INTEGER,
      material_name TEXT,
      quantity REAL NOT NULL,
      unit TEXT,
      standard_price REAL DEFAULT 0,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 订单表
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      product_id INTEGER REFERENCES products(id),
      quantity REAL NOT NULL,
      unit_price REAL,
      order_date DATE,
      status TEXT DEFAULT 'pending',
      material_cost_total REAL DEFAULT 0,
      labor_cost_total REAL DEFAULT 0,
      overhead_cost_total REAL DEFAULT 0,
      quality_cost_total REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      unit_cost REAL DEFAULT 0,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 供应商表
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_code TEXT UNIQUE NOT NULL,
      supplier_name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      address TEXT,
      level TEXT DEFAULT 'C',
      quality_score INTEGER DEFAULT 0,
      cost_score INTEGER DEFAULT 0,
      delivery_score INTEGER DEFAULT 0,
      service_score INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 采购单表
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_no TEXT UNIQUE NOT NULL,
      supplier_id INTEGER REFERENCES suppliers(id),
      material_id INTEGER,
      material_name TEXT,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      logistics_cost REAL DEFAULT 0,
      total_tco REAL DEFAULT 0,
      order_date DATE,
      delivery_date DATE,
      status TEXT DEFAULT 'pending',
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 物料主数据
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_code TEXT UNIQUE NOT NULL,
      material_name TEXT NOT NULL,
      category TEXT,
      unit TEXT DEFAULT '件',
      abc_class TEXT,
      safety_stock_qty REAL DEFAULT 0,
      unit_cost REAL DEFAULT 0,
      annual_usage_amount REAL DEFAULT 0,
      last_movement_date DATE,
      obsolete_days INTEGER DEFAULT 0,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 库存记录
    CREATE TABLE IF NOT EXISTS inventory_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER REFERENCES materials(id),
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_cost REAL,
      batch_no TEXT,
      remark TEXT,
      operator_id INTEGER,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- OEE记录
    CREATE TABLE IF NOT EXISTS oee_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_date DATE NOT NULL,
      equipment_id TEXT,
      equipment_name TEXT,
      shift TEXT,
      planned_time REAL DEFAULT 0,
      downtime REAL DEFAULT 0,
      output_qty INTEGER DEFAULT 0,
      defect_qty INTEGER DEFAULT 0,
      cycle_time REAL DEFAULT 0,
      availability REAL DEFAULT 0,
      performance REAL DEFAULT 0,
      quality_rate REAL DEFAULT 0,
      oee REAL DEFAULT 0,
      created_by INTEGER,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 质量成本记录
    CREATE TABLE IF NOT EXISTS quality_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_date DATE NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      source_type TEXT,
      order_id INTEGER,
      description TEXT,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 改善提案
    CREATE TABLE IF NOT EXISTS improvement_proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      proposer_id INTEGER REFERENCES users(id),
      department TEXT,
      category TEXT,
      description TEXT,
      expected_saving REAL DEFAULT 0,
      actual_saving REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      reviewer_id INTEGER,
      review_note TEXT,
      points INTEGER DEFAULT 0,
      bonus_amount REAL DEFAULT 0,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 生产工单表（订单穿透链路关键表）
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
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 质检记录表（订单穿透链路关键表）
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
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 设计变更成本表（研发设计成本模块）
    CREATE TABLE IF NOT EXISTS design_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      change_no TEXT UNIQUE NOT NULL,
      project_name TEXT,
      part_name TEXT,
      change_type TEXT,
      description TEXT,
      old_material TEXT,
      new_material TEXT,
      old_process TEXT,
      new_process TEXT,
      cost_impact REAL DEFAULT 0,
      saving_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      proposer_name TEXT,
      approver_name TEXT,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 目标成本表（研发设计成本模块）
    CREATE TABLE IF NOT EXISTS target_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id),
      target_cost REAL NOT NULL,
      material_target REAL DEFAULT 0,
      labor_target REAL DEFAULT 0,
      overhead_target REAL DEFAULT 0,
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 设计成本核算表（追踪实际设计成本 vs 目标成本）
    CREATE TABLE IF NOT EXISTS design_cost_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      design_change_id INTEGER REFERENCES design_changes(id),
      product_id INTEGER REFERENCES products(id),
      target_cost_id INTEGER REFERENCES target_costs(id),
      actual_material_cost REAL DEFAULT 0,
      actual_labor_cost REAL DEFAULT 0,
      actual_overhead_cost REAL DEFAULT 0,
      total_actual_cost REAL DEFAULT 0,
      variance REAL DEFAULT 0,
      variance_pct REAL DEFAULT 0,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 激励规则
    CREATE TABLE IF NOT EXISTS incentive_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT NOT NULL,
      saving_from REAL DEFAULT 0,
      saving_to REAL DEFAULT 0,
      share_ratio REAL DEFAULT 0.3,
      team_ratio REAL DEFAULT 0.5,
      personal_ratio REAL DEFAULT 0.5,
      ${isSaaS ? 'tenant_id INTEGER DEFAULT 1,' : ''}
      status INTEGER DEFAULT 1
    );
  `;

  db.exec(baseTables);
  db.exec(businessTables);
  console.log(`✅ 业务表初始化完成 [模式: ${isSaaS ? 'SaaS多租户' : 'Standalone单租户'}]`);

  // ====== Schema 迁移（处理已有数据库文件旧表结构）======
  const migrations = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").pluck();
  function addColumnIfNotExists(table, colDef) {
    const colName = colDef.split(' ')[0];
    const exists = db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === colName);
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
      console.log(`  ↳ 迁移: ${table} 新增列 ${colName}`);
    }
  }
  // users 表迁移
  if (migrations.get('users')) {
    addColumnIfNotExists('users', 'role_code TEXT DEFAULT \'staff\'');
    addColumnIfNotExists('users', 'phone TEXT');
    addColumnIfNotExists('users', 'avatar_url TEXT');
    if (isSaaS) addColumnIfNotExists('users', 'tenant_id INTEGER DEFAULT 1');
  }
  // 业务表迁移（SaaS 模式补充 tenant_id）
  if (isSaaS) {
    ['products','bom_items','orders','suppliers','purchase_orders','materials',
     'inventory_records','oee_records','quality_costs','improvement_proposals','incentive_rules',
     'work_orders','quality_inspections','design_changes','target_costs','design_cost_records'].forEach(t => {
      if (migrations.get(t)) {
        addColumnIfNotExists(t, 'tenant_id INTEGER DEFAULT 1');
      }
    });
  }

  console.log('✅ Schema 迁移检查完成');

  // ====== v2.0 国家标准对齐迁移（执行迁移文件）======
  const migrationsDir = path.join(__dirname, '../db/migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    migrationFiles.forEach(file => {
      try {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        db.exec(sql);
        console.log(`✅ 迁移文件执行成功: ${file}`);
      } catch (err) {
        // 忽略已存在的表错误
        if (!err.message.includes('already exists')) {
          console.error(`❌ 迁移文件执行失败: ${file}`, err.message);
        }
      }
    });
  }

  // ====== SaaS 专属表 ======
  if (isSaaS) {
    const saasTables = `
      -- 租户表
      CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_code TEXT UNIQUE NOT NULL,
        company_name TEXT NOT NULL,
        short_name TEXT,
        industry TEXT,
        contact_person TEXT,
        contact_phone TEXT,
        email TEXT,
        address TEXT,
        plan_id INTEGER DEFAULT 1,
        expire_date DATE,
        status TEXT DEFAULT 'active',
        max_users INTEGER DEFAULT 3,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 套餐表
      CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_code TEXT UNIQUE NOT NULL,
        plan_name TEXT NOT NULL,
        price_monthly REAL DEFAULT 0,
        price_yearly REAL DEFAULT 0,
        max_users INTEGER DEFAULT 3,
        data_retention_days INTEGER DEFAULT 30,
        features TEXT DEFAULT '{}',
        sort_order INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 平台用户表
      CREATE TABLE IF NOT EXISTS platform_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        real_name TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        phone TEXT,
        last_login_at DATETIME,
        last_login_ip TEXT,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 操作日志表
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operator_id INTEGER,
        operator_name TEXT,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id INTEGER,
        detail TEXT,
        ip TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    db.exec(saasTables);
    console.log('✅ SaaS 专属表已创建');
  }
}

function getDb() {
  if (!db) throw new Error('数据库未初始化');
  return db;
}

module.exports = { initDatabase, getDb, isSaaS };
