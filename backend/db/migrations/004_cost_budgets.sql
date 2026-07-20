-- 成本预算表（对齐GB/T 46210-2025第6.3节）
CREATE TABLE IF NOT EXISTS cost_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_code TEXT NOT NULL UNIQUE,  -- 预算编号，如：BUDGET-2026-001
    budget_name TEXT NOT NULL,  -- 预算名称
    project_id INTEGER,  -- 关联项目（可选）
    budget_type TEXT NOT NULL DEFAULT 'annual',  -- 预算类型：annual(年度)、project(项目)、monthly(月度)
    fiscal_year INTEGER,  -- 预算年度
    start_date TEXT NOT NULL,  -- 预算开始日期
    end_date TEXT NOT NULL,  -- 预算结束日期
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,  -- 预算总金额
    prepared_by INTEGER NOT NULL,  -- 编制人（用户ID）
    prepare_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 编制日期
    status TEXT NOT NULL DEFAULT 'draft',  -- 状态：draft(草稿)、reviewing(审批中)、approved(已批准)、rejected(已驳回)、executing(执行中)、completed(已完成)
    approval_workflow TEXT,  -- 审批流程JSON：[{"step":1,"role":"dept_manager","status":"pending","comment":""}]
    wbs_structure TEXT,  -- WBS分解结构JSON
    notes TEXT,  -- 备注
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (prepared_by) REFERENCES users(id)
);

-- 预算明细表（按成本科目分解）
CREATE TABLE IF NOT EXISTS cost_budget_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_id INTEGER NOT NULL,
    account_code TEXT NOT NULL,  -- 成本科目编码（关联cost_accounts）
    account_name TEXT NOT NULL,  -- 成本科目名称
    wbs_code TEXT,  -- WBS编码（可选）
    wbs_name TEXT,  -- WBS名称（可选）
    planned_amount DECIMAL(15,2) NOT NULL DEFAULT 0,  -- 计划金额
    adjusted_amount DECIMAL(15,2) NOT NULL DEFAULT 0,  -- 调整后金额（审批调整后）
    actual_amount DECIMAL(15,2) DEFAULT 0,  -- 实际发生金额（执行中更新）
    variance_amount DECIMAL(15,2) GENERATED ALWAYS AS (actual_amount - adjusted_amount) STORED,  -- 差异金额
    variance_rate DECIMAL(5,2) GENERATED ALWAYS AS (CASE WHEN adjusted_amount != 0 THEN (actual_amount - adjusted_amount) / adjusted_amount * 100 ELSE 0 END) STORED,  -- 差异率(%)
    notes TEXT,  -- 备注
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_id) REFERENCES cost_budgets(id) ON DELETE CASCADE
);

-- 预算审批记录表
CREATE TABLE IF NOT EXISTS cost_budget_approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_id INTEGER NOT NULL,
    approval_step INTEGER NOT NULL,  -- 审批步骤
    approver_id INTEGER NOT NULL,  -- 审批人（用户ID）
    approval_role TEXT NOT NULL,  -- 审批角色
    status TEXT NOT NULL DEFAULT 'pending',  -- 状态：pending(待审批)、approved(已批准)、rejected(已驳回)
    comment TEXT,  -- 审批意见
    approval_date TEXT,  -- 审批日期
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_id) REFERENCES cost_budgets(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- 预算执行监控表（实时跟踪预算执行情况）
CREATE TABLE IF NOT EXISTS cost_budget_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_id INTEGER NOT NULL,
    account_code TEXT NOT NULL,  -- 成本科目编码
    period TEXT NOT NULL,  -- 期间：2026-01、2026-Q1等
    planned_amount DECIMAL(15,2) NOT NULL DEFAULT 0,  -- 计划金额（当期）
    actual_amount DECIMAL(15,2) NOT NULL DEFAULT 0,  -- 实际金额（当期）
    commitment_amount DECIMAL(15,2) DEFAULT 0,  -- 承诺金额（已承诺未支付）
    forecast_amount DECIMAL(15,2) DEFAULT 0,  -- 预测金额（剩余期间预测）
    variance_amount DECIMAL(15,2) GENERATED ALWAYS AS (actual_amount - planned_amount) STORED,  -- 差异金额
    variance_rate DECIMAL(5,2) GENERATED ALWAYS AS (CASE WHEN planned_amount != 0 THEN (actual_amount - planned_amount) / planned_amount * 100 ELSE 0 END) STORED,  -- 差异率(%)
    alert_level TEXT GENERATED ALWAYS AS (CASE WHEN variance_rate > 10 THEN 'red' WHEN variance_rate > 5 THEN 'yellow' ELSE 'green' END) STORED,  -- 预警级别
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_id) REFERENCES cost_budgets(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cost_budgets_project ON cost_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_budgets_status ON cost_budgets(status);
CREATE INDEX IF NOT EXISTS idx_cost_budget_details_budget ON cost_budget_details(budget_id);
CREATE INDEX IF NOT EXISTS idx_cost_budget_details_account ON cost_budget_details(account_code);
CREATE INDEX IF NOT EXISTS idx_cost_budget_approvals_budget ON cost_budget_approvals(budget_id);
CREATE INDEX IF NOT EXISTS idx_cost_budget_executions_budget ON cost_budget_executions(budget_id);

-- 初始化示例预算数据（可选）
-- INSERT INTO cost_budgets (budget_code, budget_name, budget_type, fiscal_year, start_date, end_date, total_amount, prepared_by, status) VALUES
-- ('BUDGET-2026-001', '2026年度生产成本预算', 'annual', 2026, '2026-01-01', '2026-12-31', 5000000, 1, 'draft');
