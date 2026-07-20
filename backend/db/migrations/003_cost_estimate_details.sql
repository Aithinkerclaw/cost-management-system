-- 成本估算明细表（支持自下而上估算方法）
CREATE TABLE IF NOT EXISTS cost_estimate_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estimate_id INTEGER NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(15,2) DEFAULT 0,
    unit_price DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) DEFAULT 0,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estimate_id) REFERENCES cost_estimates(id) ON DELETE CASCADE
);

-- 成本概算表（对齐GB/T 46210-2025 第6.3节）
CREATE TABLE IF NOT EXISTS cost_budgetary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budgetary_no VARCHAR(50) NOT NULL UNIQUE,
    project_name VARCHAR(200) NOT NULL,
    project_code VARCHAR(50),
    feasibility_stage VARCHAR(50),
    total_investment DECIMAL(15,2),
    construction_cost DECIMAL(15,2),
    equipment_cost DECIMAL(15,2),
    installation_cost DECIMAL(15,2),
    other_cost DECIMAL(15,2),
    working_capital DECIMAL(15,2),
    total_estimated_cost DECIMAL(15,2),
    approval_status VARCHAR(20) DEFAULT 'pending',
    approver_id VARCHAR(50),
    approved_at DATETIME,
    remark TEXT,
    tenant_id VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 成本概算明细表
CREATE TABLE IF NOT EXISTS cost_budgetary_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budgetary_id INTEGER NOT NULL,
    cost_item VARCHAR(200) NOT NULL,
    estimated_amount DECIMAL(15,2) DEFAULT 0,
    remark TEXT,
    FOREIGN KEY (budgetary_id) REFERENCES cost_budgetary(id) ON DELETE CASCADE
);
