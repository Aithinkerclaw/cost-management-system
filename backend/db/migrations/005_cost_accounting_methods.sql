-- 成本核算方法配置表（对齐财会〔2013〕17号）
CREATE TABLE IF NOT EXISTS cost_accounting_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method_code TEXT NOT NULL UNIQUE,  -- 核算方法编码：variety(品种法)、batch(分批法)、step(分步法)
    method_name TEXT NOT NULL,  -- 核算方法名称
    description TEXT,  -- 方法描述
    applicable_scenarios TEXT,  -- 适用场景
    is_enabled INTEGER NOT NULL DEFAULT 1,  -- 是否启用：1=启用，0=禁用
    is_default INTEGER NOT NULL DEFAULT 0,  -- 是否默认方法
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 成本核算对象表（配置成本核算对象）
CREATE TABLE IF NOT EXISTS cost_accounting_objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_code TEXT NOT NULL UNIQUE,  -- 核算对象编码
    object_name TEXT NOT NULL,  -- 核算对象名称（如：产品A、批次B、步骤C）
    object_type TEXT NOT NULL,  -- 对象类型：product(产品)、batch(批次)、step(步骤)、project(项目)
    method_code TEXT NOT NULL,  -- 核算方法编码（关联cost_accounting_methods）
    cost_account_code TEXT,  -- 成本科目编码（关联cost_accounts，用于该对象的成本归集）
    parent_object_id INTEGER,  -- 父级核算对象ID（用于分步法的步骤层级）
    sort_order INTEGER DEFAULT 0,  -- 排序顺序
    is_enabled INTEGER NOT NULL DEFAULT 1,  -- 是否启用
    notes TEXT,  -- 备注
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_object_id) REFERENCES cost_accounting_objects(id),
    FOREIGN KEY (method_code) REFERENCES cost_accounting_methods(method_code)
);

-- 成本归集与分配表（记录成本归集和分配过程）
CREATE TABLE IF NOT EXISTS cost_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    allocation_code TEXT NOT NULL UNIQUE,  -- 分配编码：ALLOC-20260616-001
    accounting_period TEXT NOT NULL,  -- 核算期间：2026-06
    object_id INTEGER NOT NULL,  -- 核算对象ID（关联cost_accounting_objects）
    account_code TEXT NOT NULL,  -- 成本科目编码（关联cost_accounts）
    account_name TEXT NOT NULL,  -- 成本科目名称
    
    -- 直接成本
    direct_material DECIMAL(15,2) DEFAULT 0,  -- 直接材料
    direct_labor DECIMAL(15,2) DEFAULT 0,  -- 直接人工
    manufacturing_overhead DECIMAL(15,2) DEFAULT 0,  -- 制造费用
    
    -- 间接成本分配
    allocated_overhead DECIMAL(15,2) DEFAULT 0,  -- 分配的制造费用
    allocation_base TEXT,  -- 分配基准（如：人工工时、机器工时、直接人工成本）
    allocation_rate DECIMAL(10,4),  -- 分配率
    
    -- 总成本
    total_cost DECIMAL(15,2) GENERATED ALWAYS AS (direct_material + direct_labor + manufacturing_overhead + allocated_overhead) STORED,  -- 总成本
    
    -- 单位成本
    output_quantity DECIMAL(15,2),  -- 完工产量
    unit_cost DECIMAL(15,2) GENERATED ALWAYS AS (CASE WHEN output_quantity != 0 THEN total_cost / output_quantity ELSE 0 END) STORED,  -- 单位成本
    
    status TEXT NOT NULL DEFAULT 'draft',  -- 状态：draft(草稿)、calculated(已计算)、approved(已审核)、posted(已入账)
    notes TEXT,  -- 备注
    created_by INTEGER,  -- 创建人
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (object_id) REFERENCES cost_accounting_objects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cost_accounting_methods_code ON cost_accounting_methods(method_code);
CREATE INDEX IF NOT EXISTS idx_cost_accounting_objects_method ON cost_accounting_objects(method_code);
CREATE INDEX IF NOT EXISTS idx_cost_allocations_period ON cost_allocations(accounting_period);
CREATE INDEX IF NOT EXISTS idx_cost_allocations_object ON cost_allocations(object_id);

-- 初始化核算方法数据（对齐财会〔2013〕17号）
INSERT OR IGNORE INTO cost_accounting_methods (method_code, method_name, description, applicable_scenarios, is_enabled, is_default) VALUES
('variety', '品种法', '以产品品种为成本核算对象，适用于大量大批单步骤生产的企业', '适用于大量大批单步骤生产的企业，如发电、采掘、供水等企业', 1, 1),
('batch', '分批法', '以产品批别为成本核算对象，适用于单件小批生产的企业', '适用于单件小批生产的企业，如造船、重型机械、精密仪器等企业', 1, 0),
('step', '分步法', '以生产步骤为成本核算对象，适用于大量大批多步骤生产的企业', '适用于大量大批多步骤生产的企业，如纺织、冶金、造纸、汽车制造等企业', 1, 0);

-- 初始化示例核算对象（品种法示例）
INSERT OR IGNORE INTO cost_accounting_objects (object_code, object_name, object_type, method_code, cost_account_code, is_enabled, notes) VALUES
('PROD-001', '产品A', 'product', 'variety', '5001', 1, '品种法核算示例-产品A'),
('PROD-002', '产品B', 'product', 'variety', '5001', 1, '品种法核算示例-产品B');
