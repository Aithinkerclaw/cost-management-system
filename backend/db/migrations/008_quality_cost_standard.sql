-- 质量成本标准分类表（对齐GB/T 46709-2025）
CREATE TABLE IF NOT EXISTS quality_cost_standard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cost_category VARCHAR(20) NOT NULL,
    cost_item VARCHAR(100) NOT NULL,
    account_code VARCHAR(20),
    description TEXT,
    is_enabled BOOLEAN DEFAULT 1,
    tenant_id VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 内置GB/T 46709四大类质量成本（T/GXDSL 234—2025）
INSERT OR IGNORE INTO quality_cost_standard (cost_category, cost_item, account_code, description) VALUES
('prevention', '质量计划编制费', '4001', '制定质量计划、质量目标等费用'),
('prevention', '质量培训费', '4002', '员工质量意识、技能培训费用'),
('prevention', '质量评审费', '4003', '设计评审、过程评审等费用'),
('prevention', '质量改进费', '4004', '质量改进项目投入'),
('prevention', '供应商评估费', '4005', '供应商质量能力评估费用'),
('appraisal', '进货检验费', '4006', '原材料、外购件检验费用'),
('appraisal', '过程检验费', '4007', '生产过程中检验费用'),
('appraisal', '成品检验费', '4008', '成品出厂前检验费用'),
('appraisal', '检测设备维护费', '4009', '检测设备校准、维护费用'),
('appraisal', '质量认证费', '4010', 'ISO9001等质量体系认证费用'),
('internal_failure', '返工返修费', '4011', '不合格品返工、返修费用'),
('internal_failure', '报废损失费', '4012', '无法修复的废品损失'),
('internal_failure', '停工损失费', '4013', '质量问题导致停工的损失'),
('internal_failure', '质量降级损失', '4014', '质量不达标但可降级使用的损失'),
('internal_failure', '内部索赔费', '4015', '内部工序间质量索赔'),
('external_failure', '保修费', '4016', '产品保修期内维修费用'),
('external_failure', '退货损失费', '4017', '客户退货、换货损失'),
('external_failure', '索赔费', '4018', '因质量问题向客户支付赔偿'),
('external_failure', '投诉处理费', '4019', '处理客户质量投诉费用'),
('external_failure', '产品召回费', '4020', '产品召回、销毁费用');
