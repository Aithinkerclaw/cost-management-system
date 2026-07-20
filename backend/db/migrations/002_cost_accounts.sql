-- 成本科目表（对齐财会〔2013〕17号）
CREATE TABLE IF NOT EXISTS cost_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_code VARCHAR(20) NOT NULL UNIQUE,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    parent_id INTEGER,
    is_standard BOOLEAN DEFAULT 0,
    is_enabled BOOLEAN DEFAULT 1,
    tenant_id VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES cost_accounts(id)
);

-- 内置标准成本科目模板（财会〔2013〕17号）
INSERT OR IGNORE INTO cost_accounts (account_code, account_name, account_type, parent_id, is_standard, is_enabled) VALUES
('1000', '直接材料', 'direct_material', NULL, 1, 1),
('1001', '原材料', 'direct_material', 1, 1, 1),
('1002', '辅助材料', 'direct_material', 1, 1, 1),
('1003', '外购半成品', 'direct_material', 1, 1, 1),
('2000', '燃料和动力', 'fuel_labor', NULL, 1, 1),
('2001', '燃料费', 'fuel_labor', 4, 1, 1),
('2002', '动力费', 'fuel_labor', 4, 1, 1),
('3000', '直接人工', 'direct_labor', NULL, 1, 1),
('3001', '生产工人工资', 'direct_labor', 7, 1, 1),
('3002', '生产工人奖金', 'direct_labor', 7, 1, 1),
('3003', '生产工人福利费', 'direct_labor', 7, 1, 1),
('4000', '制造费用', 'manufacturing_overhead', NULL, 1, 1),
('4001', '车间管理人员工资', 'manufacturing_overhead', 11, 1, 1),
('4002', '车间折旧费', 'manufacturing_overhead', 11, 1, 1),
('4003', '车间维修费', 'manufacturing_overhead', 11, 1, 1),
('4004', '车间水电费', 'manufacturing_overhead', 11, 1, 1),
('4005', '工具摊销费', 'manufacturing_overhead', 11, 1, 1);
