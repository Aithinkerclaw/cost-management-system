-- 成本绩效评价KPI指标库（对齐GB/T 46210-2025第8章）
CREATE TABLE IF NOT EXISTS cost_kpi_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kpi_code TEXT NOT NULL UNIQUE,  -- KPI编码：KPI-001
    kpi_name TEXT NOT NULL,  -- KPI名称
    kpi_category TEXT NOT NULL,  -- KPI类别：cost_control(成本控制)、budget_execution(预算执行)、efficiency(效率)、quality(质量)
    description TEXT,  -- KPI描述
    calculation_formula TEXT,  -- 计算公式
    unit TEXT,  -- 单位：%（比率）、yuan(元)、days(天)、score(分)
    target_value DECIMAL(10,2),  -- 目标值
    warning_threshold DECIMAL(10,2),  -- 预警阈值
    excellent_threshold DECIMAL(10,2),  -- 优秀阈值
    data_source TEXT,  -- 数据来源
    frequency TEXT NOT NULL DEFAULT 'monthly',  -- 统计频率：daily(每日)、weekly(每周)、monthly(每月)、quarterly(每季度)、yearly(每年)
    is_enabled INTEGER NOT NULL DEFAULT 1,  -- 是否启用：1=启用，0=禁用
    is_system INTEGER NOT NULL DEFAULT 1,  -- 是否系统预设：1=系统预设，0=自定义
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 成本绩效评价记录表
CREATE TABLE IF NOT EXISTS cost_kpi_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluation_code TEXT NOT NULL UNIQUE,  -- 评价编码：EVAL-20260616-001
    evaluation_name TEXT NOT NULL,  -- 评价名称
    evaluation_period TEXT NOT NULL,  -- 评价期间：2026-06
    project_id INTEGER,  -- 关联项目（可选）
    department_id INTEGER,  -- 关联部门（可选）
    evaluator_id INTEGER NOT NULL,  -- 评价人（用户ID）
    evaluation_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 评价日期
    total_score DECIMAL(5,2),  -- 总评分
    grade TEXT,  -- 等级：A(优秀)、B(良好)、C(合格)、D(待改进)
    status TEXT NOT NULL DEFAULT 'draft',  -- 状态：draft(草稿)、calculated(已计算)、reviewed(已审核)、approved(已批准)
    comments TEXT,  -- 评价意见
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (evaluator_id) REFERENCES users(id)
);

-- 成本绩效KPI评分明细表
CREATE TABLE IF NOT EXISTS cost_kpi_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluation_id INTEGER NOT NULL,  -- 评价ID（关联cost_kpi_evaluations）
    kpi_id INTEGER NOT NULL,  -- KPI ID（关联cost_kpi_library）
    kpi_code TEXT NOT NULL,  -- KPI编码
    kpi_name TEXT NOT NULL,  -- KPI名称
    actual_value DECIMAL(15,4),  -- 实际值
    target_value DECIMAL(15,4),  -- 目标值
    score DECIMAL(5,2),  -- 得分
    weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,  -- 权重
    weighted_score DECIMAL(5,2) GENERATED ALWAYS AS (score * weight / 100) STORED,  -- 加权得分
    trend TEXT,  -- 趋势：up(上升)、down(下降)、stable(稳定)
    analysis TEXT,  -- 分析说明
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluation_id) REFERENCES cost_kpi_evaluations(id) ON DELETE CASCADE,
    FOREIGN KEY (kpi_id) REFERENCES cost_kpi_library(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cost_kpi_library_category ON cost_kpi_library(kpi_category);
CREATE INDEX IF NOT EXISTS idx_cost_kpi_evaluations_period ON cost_kpi_evaluations(evaluation_period);
CREATE INDEX IF NOT EXISTS idx_cost_kpi_scores_evaluation ON cost_kpi_scores(evaluation_id);

-- 初始化系统预设KPI指标（对齐GB/T 46210-2025）
INSERT OR IGNORE INTO cost_kpi_library (kpi_code, kpi_name, kpi_category, description, calculation_formula, unit, target_value, warning_threshold, excellent_threshold, data_source, frequency, is_enabled, is_system) VALUES
('KPI-001', '成本降低率', 'cost_control', '本期成本较上年同期降低的百分比', '(上期成本-本期成本)/上期成本×100%', '%', 5.00, 0.00, 10.00, '成本台账', 'monthly', 1, 1),
('KPI-002', '预算执行偏差率', 'budget_execution', '实际成本与预算成本的偏差率', '(实际成本-预算成本)/预算成本×100%', '%', 0.00, 5.00, 2.00, '预算执行数据', 'monthly', 1, 1),
('KPI-003', 'OEE设备综合效率', 'efficiency', '设备综合效率', '可用率×性能率×合格率/10000', '%', 85.00, 65.00, 90.00, '生产系统', 'monthly', 1, 1),
('KPI-004', '质量成本率', 'quality', '质量成本占总成本的比例', '质量成本/总成本×100%', '%', 5.00, 10.00, 3.00, '质量成本数据', 'monthly', 1, 1),
('KPI-005', '成本利润率', 'cost_control', '成本费用利润率', '利润总额/成本费用总额×100%', '%', 15.00, 5.00, 20.00, '财务报表', 'monthly', 1, 1);
