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
    tenant_id VARCHAR(50),
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
    tenant_id VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
