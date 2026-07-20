# 创新型中小企业成本管理系统 — 系统架构设计文档

> 版本：V1.0 | 日期：2026-06-12 | 基于 PRD-V1.md

---

## 一、技术选型

### 1.1 整体技术栈

| 层 | 技术 | 版本 | 选型理由 |
|----|------|------|----------|
| **前端框架** | Vue 3 | ^3.4 | 组合式API、性能优秀、生态成熟 |
| **构建工具** | Vite | ^5.x | 极速HMR、开箱即用 |
| **UI组件库** | Element Plus | ^2.x | 企业级组件丰富、中文文档完善 |
| **图表库** | ECharts | ^5.x | 驾驶舱可视化首选，PDF方案推荐 |
| **状态管理** | Pinia | ^2.x | Vue3官方推荐、轻量 |
| **路由** | Vue Router | ^4.x | SPA路由管理 |
| **后端框架** | Express.js | ^4.x | Node生态最成熟、学习成本低 |
| **数据库** | SQLite3 (better-sqlite3) | latest | 零配置、文件型DB、适合中小部署 |
| **ORM** | 原生SQL + 工具函数 | - | 避免ORM开销，保持灵活性 |
| **认证** | JWT (jsonwebtoken) | - | 无状态Token认证 |

### 1.2 替代方案对比（未采用）

| 方案 | 优势 | 劣势 | 未选原因 |
|------|------|------|----------|
| Spring Boot + MyBatis | 企业级标准 | 重、Java环境配置复杂 | 用户技术背景有限，开发效率低 |
| Next.js SSR | 全栈一体化 | 学习曲线陡峭 | 不适合传统后台管理系统 |
| PostgreSQL | 功能强大 | 需要安装服务 | SQLite零配置更适合MVP起步 |

### 1.3 为什么选这个组合？
- ✅ **前端Vue3+Element Plus**：与PDF原方案一致，专业企业级UI
- ✅ **后端Node.js**：JavaScript全栈，前后端统一语言，降低维护成本
- ✅ **SQLite**：无需安装数据库服务，一个db文件搞定，后续可无缝迁移MySQL
- ✅ **全部开源免费**：零授权成本，符合中小企业定位

---

## 二、系统架构图

```
┌───────────────────────────────────────────────────────┐
│                    用户浏览器                          │
│         (PC Chrome / 移动端H5 / 小程序)                │
└───────────────────────┬───────────────────────────────┘
                        │ HTTPS / REST API
┌───────────────────────▼───────────────────────────────┐
│                  Nginx (可选)                         │
└───────────────────────┬───────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────┐
│              前端应用 (Vue3 + Vite)                    │
│  ┌─────────┬────────┬────────┬────────┬──────────┐   │
│  │ 路由    │ 状态    │ UI组件  │ 图表    │ 工具函数 │   │
│  │ Router  │ Pinia   │ Elem+  │ ECharts │ Utils    │   │
│  └─────────┴────────┴────────┴────────┴──────────┘   │
└───────────────────────┬───────────────────────────────┘
                        │ API Call (axios)
┌───────────────────────▼───────────────────────────────┐
│             后端服务 (Express.js)                      │
│  ┌──────────┬──────────┬──────────┬──────────┐       │
│  │ 认证中间件│ 路由层   │ 业务逻辑层 │ 数据访问层│       │
│  │ JWT      │ Routes   │ Services │ DAO      │       │
│  └──────────┴──────────┴──────────┴──────────┘       │
│  ┌──────────┬──────────┬──────────────────┐          │
│  │ 导入导出 │ 文件上传  │ 定时任务(可选)    │          │
│  │ Excel   │ Upload  │ Cron            │          │
│  └──────────┴──────────┴──────────────────┘          │
└───────────────────────┬───────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────┐
│              数据层 (SQLite3)                          │
│  cost_management.db                                    │
│  ├── users / roles / permissions                      │
│  ├── products / boms / orders                         │
│  ├── suppliers / purchase_orders                      │
│  ├── materials / inventory                            │
│  ├── production_records / oee_data                    │
│  ├── quality_records / cost_records                   │
│  ├── improvement_proposals / incentives               │
│  └── dashboard_config                                 │
└───────────────────────────────────────────────────────┘
```

---

## 三、项目文件结构

```
cost-management-system/
├── backend/
│   ├── package.json
│   ├── server.js                    # 入口文件
│   ├── app.js                       # Express应用配置
│   ├── config/
│   │   └── database.js              # 数据库连接 & 初始化
│   ├── routes/                      # 路由层
│   │   ├── auth.js                  # 认证路由（登录/注册）
│   │   ├── dashboard.js             # 驾驶舱数据接口
│   │   ├── cost-accounting.js       # 成本核算
│   │   ├── procurement.js           # 采购管理
│   │   ├── inventory.js             # 库存管理
│   │   ├── production.js            # 生产精益
│   │   ├── quality.js               # 质量成本
│   │   └── incentive.js             # 激励中心
│   ├── services/                    # 业务逻辑层
│   │   ├── dashboard.service.js
│   │   ├── cost-accounting.service.js
│   │   ├── procurement.service.js
│   │   ├── inventory.service.js
│   │   ├── production.service.js
│   │   ├── quality.service.js
│   │   └── incentive.service.js
│   ├── models/                      # 数据模型定义
│   │   ├── user.model.js
│   │   ├── product.model.js
│   │   ├── order.model.js
│   │   ├── supplier.model.js
│   │   ├── material.model.js
│   │   ├── inventory.model.js
│   │   ├── production.model.js
│   │   ├── quality.model.js
│   │   └── proposal.model.js
│   ├── db/
│   │   ├── init.sql                 # 建表语句
│   │   └── seed.js                  # 种子数据（演示用）
│   ├── middleware/
│   │   ├── auth.js                  # JWT验证中间件
│   │   └── errorHandler.js          # 全局错误处理
│   └── utils/
│       ├── response.js              # 统一响应格式
│       └── date.js                  # 日期工具
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── main.js                 # 入口
│   │   ├── App.vue                 # 根组件
│   │   ├── router/
│   │   │   └── index.js            # 路由配置
│   │   ├── stores/                  # Pinia状态管理
│   │   │   ├── user.js
│   │   │   ├── dashboard.js
│   │   │   └── app.js
│   │   ├── api/                     # API请求封装
│   │   │   ├── request.js           # axios实例
│   │   │   ├── dashboard.js
│   │   │   ├── cost-accounting.js
│   │   │   ├── procurement.js
│   │   │   ├── inventory.js
│   │   │   ├── production.js
│   │   │   ├── quality.js
│   │   │   └── incentive.js
│   │   ├── views/                   # 页面组件
│   │   │   ├── login/
│   │   │   │   └── LoginView.vue
│   │   │   ├── layout/
│   │   │   │   └── MainLayout.vue   # 主布局（侧边栏+顶栏+内容区）
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardView.vue
│   │   │   ├── cost-accounting/
│   │   │   │   ├── CostOverview.vue     # 核算总览
│   │   │   │   ├── MaterialCost.vue     # 材料成本
│   │   │   │   ├── LaborCost.vue        # 人工成本
│   │   │   │   ├── OverheadCost.vue     # 制造费用
│   │   │   │   └── OrderTrace.vue       # 订单追溯
│   │   │   ├── procurement/
│   │   │   │   ├── SupplierList.vue     # 供应商列表
│   │   │   │   ├── TcoCalculator.vue    # TCO计算器
│   │   │   │   ├── PriceTrend.vue       # 价格趋势
│   │   │   │   └── CentralPurchase.vue  # 集采建议
│   │   │   ├── inventory/
│   │   │   │   ├── AbcAnalysis.vue      # ABC分类
│   │   │   │   ├── SafetyStock.vue      # 安全库存
│   │   │   │   ├── ObsoleteAlert.vue    # 呆滞预警
│   │   │   │   └── TurnoverSimulate.vue # 周转模拟
│   │   │   ├── production/
│   │   │   │   ├── OeeCalculator.vue    # OEE计算
│   │   │   │   ├── ValueStreamMap.vue   # VSM图
│   │   │   │   ├── SmedTracker.vue      # SMED跟踪
│   │   │   │   └── BottleneckDetect.vue # 瓶颈识别
│   │   │   ├── quality/
│   │   │   │   ├── QualityCostView.vue  # 质量成本总览
│   │   │   │   ├── PafAnalysis.vue      # PAF分析
│   │   │   │   ├── SpcChart.vue         # SPC控制图
│   │   │   │   └── DefectTrace.vue      # 不良品追溯
│   │   │   └── incentive/
│   │   │       ├── ShareCalculator.vue  # 分享计算器
│   │   │       ├── ProposalManage.vue   # 提案管理
│   │   │       └── LeanCert.vue         # 精益认证
│   │   ├── components/                # 公共组件
│   │   │   ├── KpiCard.vue            # KPI指标卡片
│   │   │   ├── CostRingChart.vue      # 成本环形图
│   │   │   ├── TrendLineChart.vue     # 趋势折线图
│   │   │   ├── AlertList.vue          # 预警列表
│   │   │   ├── StatCard.vue           # 统计卡片
│   │   │   └── DataFilterBar.vue      # 数据筛选栏
│   │   ├── styles/
│   │   │   └── variables.css          # CSS变量/主题色
│   │   └── utils/
│   │       ├── format.js              # 数字/日期格式化
│   │       └── constants.js           # 常量定义
│
├── deliverables/
│   ├── PRD-V1.md                      # 产品需求文档
│   └── ARCHITECTURE-V1.md             # 本文档
│
└── README.md
```

---

## 四、核心数据模型

### 4.1 用户与权限
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  real_name TEXT,
  role TEXT DEFAULT 'staff',        -- admin/manager/staff
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  status INTEGER DEFAULT 1,         -- 1=启用 0=禁用
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 产品与BOM
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT '件',
  standard_cost REAL DEFAULT 0,
  target_cost REAL DEFAULT 0,
  target_price REAL DEFAULT 0,
  target_margin REAL DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bom_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id),
  material_id INTEGER,
  material_name TEXT,
  quantity REAL NOT NULL,
  unit TEXT,
  standard_price REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 订单与成本记录
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  quantity REAL NOT NULL,
  unit_price REAL,
  order_date DATE,
  status TEXT DEFAULT 'pending',    -- pending/production/completed
  -- 成本汇总字段
  material_cost_total REAL DEFAULT 0,
  labor_cost_total REAL DEFAULT 0,
  overhead_cost_total REAL DEFAULT 0,
  quality_cost_total REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  unit_cost REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.4 供应商
```sql
CREATE TABLE suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_code TEXT UNIQUE NOT NULL,
  supplier_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  level TEXT DEFAULT 'C',           -- A/B/C/D
  -- QCDS评分 (各100分制)
  quality_score INTEGER DEFAULT 0,
  cost_score INTEGER DEFAULT 0,
  delivery_score INTEGER DEFAULT 0,
  service_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.5 采购单
```sql
CREATE TABLE purchase_orders (
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.6 库存物料
```sql
CREATE TABLE materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_code TEXT UNIQUE NOT NULL,
  material_name TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT '件',
  abc_class TEXT,                   -- A/B/C
  safety_stock_qty REAL DEFAULT 0,
  unit_cost REAL DEFAULT 0,
  annual_usage_amount REAL DEFAULT 0,
  last_movement_date DATE,
  obsolete_days INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER REFERENCES materials(id),
  type TEXT NOT NULL,               -- in/out/adjust/check
  quantity REAL NOT NULL,
  unit_cost REAL,
  batch_no TEXT,
  remark TEXT,
  operator_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.7 生产/OEE
```sql
CREATE TABLE oee_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_date DATE NOT NULL,
  equipment_id TEXT,
  equipment_name TEXT,
  shift TEXT,                       -- 早班/中班/夜班
  planned_time REAL DEFAULT 0,      -- 计划运行时间(分钟)
  downtime REAL DEFAULT 0,          -- 停机时间(分钟)
  output_qty INTEGER DEFAULT 0,     -- 产量
  defect_qty INTEGER DEFAULT 0,     -- 不良品数
  -- OEE自动计算结果
  availability REAL DEFAULT 0,      -- 可用率
  performance REAL DEFAULT 0,       -- 性能率
  quality_rate REAL DEFAULT 0,      -- 合格率
  oee REAL DEFAULT 0,               -- 综合OEE
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.8 质量
```sql
CREATE TABLE quality_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_date DATE NOT NULL,
  type TEXT NOT NULL,               -- prevention/appraisal/internal_failure/external_failure
  amount REAL NOT NULL,
  source_type TEXT,                 -- rework/scrap/claim/warranty
  order_id INTEGER,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.9 改善提案与激励
```sql
CREATE TABLE improvement_proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  proposer_id INTEGER REFERENCES users(id),
  department TEXT,
  category TEXT,                    -- cost-saving/efficiency/quality/safety
  description TEXT,
  expected_saving REAL DEFAULT 0,
  actual_saving REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',      -- draft/reviewing/approved/implementing/completed/closed
  reviewer_id INTEGER,
  review_note TEXT,
  points INTEGER DEFAULT 0,
  bonus_amount REAL DEFAULT 0,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE TABLE incentive_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT NOT NULL,
  saving_from REAL DEFAULT 0,
  saving_to REAL DEFAULT 0,
  share_ratio REAL DEFAULT 0.3,     -- 分享比例
  team_ratio REAL DEFAULT 0.5,      -- 团队占比
  personal_ratio REAL DEFAULT 0.5,  # 个人占比
  status INTEGER DEFAULT 1
);
```

---

## 五、核心API设计

### 5.1 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 5.2 API清单

#### 认证模块 `/api/auth`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录获取JWT |
| POST | `/api/auth/register` | 注册用户 |
| GET | `/api/auth/profile` | 获取当前用户信息 |

#### 驾驶舱 `/api/dashboard`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/kpis` | 关键指标卡片数据 |
| GET | `/api/dashboard/cost-structure` | 成本结构（环形图） |
| GET | `/api/dashboard/unit-cost-trend` | 单位成本趋势 |
| GET | `/api/dashboard/alerts` | 异常预警列表 |
| GET | `/api/dashboard/projects` | 改善项目动态 |

#### 成本核算 `/api/cost`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/cost/overview` | 核算总览 |
| GET | `/api/cost/materials` | 材料成本明细 |
| GET | `/api/cost/labor` | 人工成本明细 |
| GET | `/api/cost/overhead` | 制造费用明细 |
| GET | `/api/cost/orders/:id` | 单订单成本追溯 |

#### 采购管理 `/api/procurement`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/procurement/suppliers` | 供应商列表 |
| POST | `/api/procurement/suppliers` | 新增供应商 |
| PUT | `/api/procurement/suppliers/:id` | 更新供应商QCDS |
| GET | `/api/procurement/tco` | TCO对比分析 |
| GET | `/api/procurement/price-trends` | 价格趋势 |
| GET | `/api/procurement/central-purchase` | 集采建议 |

#### 库存管理 `/api/inventory`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/inventory/materials` | 物料列表 |
| GET | `/api/inventory/abc-analysis` | ABC分类分析 |
| GET | `/api/inventory/safety-stock` | 安全库存计算 |
| GET | `/api/inventory/obsolete-alerts` | 呆滞预警 |
| POST | `/api/inventory/turnover-simulate` | 周转模拟 |

#### 生产精益 `/api/production`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/production/oee` | 录入OEE数据 |
| GET | `/api/production/oee/:date` | 查询OEE记录 |
| GET | `/api/production/vsm-data` | VSM图数据 |
| POST | `/api/production/smed` | 录入换模数据 |

#### 质量成本 `/api/quality`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/quality/overview` | 质量成本总览 |
| GET | `/api/quality/paf` | PAF分析数据 |
| POST | `/api/quality/spc` | 录入SPC数据 |
| GET | `/api/quality/spc-charts` | SPC控制图数据 |

#### 激励中心 `/api/incentive`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/incentive/calculator` | 分享计算器参数 |
| POST | `/api/incentive/calculate` | 计算分享奖金 |
| GET | `/api/incentive/proposals` | 提案列表 |
| POST | `/api/incentive/proposals` | 提交提案 |
| PUT | `/api/incentive/proposals/:id/status` | 审批提案 |
| GET | `/api/incentive/leaderboard` | 积分排行榜 |

---

## 六、任务分解（实现顺序）

### Phase 1：项目骨架 + 基础设施 [Task 1-5]

| ID | 任务 | 依赖 | 预估文件数 |
|----|------|------|-----------|
| T01 | 后端初始化：package.json + server.js + Express基础配置 | 无 | 3 |
| T02 | 数据库初始化：建表脚本 + 种子数据 | T01 | 2 |
| T03 | 前端初始化：Vite + Vue3 + Element Plus + 路由 + Pinia | 无 | 5 |
| T04 | 认证系统：登录页 + JWT中间件 + 用户CRUD | T01,T02,T03 | 6 |
| T05 | 主布局：MainLayout（侧边栏导航 + 顶栏 + 内容区） | T03,T04 | 2 |

### Phase 2：驾驶舱 + 成本核算 [Task 6-9]

| ID | 任务 | 依赖 | 预估文件数 |
|----|------|------|-----------|
| T06 | 驾驶舱完整页面：KPI卡片 + 环形图 + 趋势图 + 预警列表 | T04,T05 | 8 |
| T07 | 成本核算模块：总览 + 材料/人工/制造费用 + 订单追溯 | T06 | 10 |
| T08 | 后端API：驾驶舱 + 成本核算全接口 | T02,T06 | 6 |

### Phase 3：采购 + 库存模块 [Task 10-12]

| ID | 任务 | 依赖 | 预估文件数 |
|----|------|------|-----------|
| T09 | 采购管理：供应商列表 + TCO计算 + 价格趋势 + 集采建议 | T05 | 10 |
| T10 | 库存控制：ABC分类 + 安全库存 + 呆滞预警 + 周转模拟 | T05 | 10 |
| T11 | 后端API：采购 + 库存全接口 | T02,T09,T10 | 6 |

### Phase 4：生产精益 + 质量成本 [Task 13-15]

| ID | 任务 | 依赖 | 预估文件数 |
|----|------|------|-----------|
| T12 | 生产精益：OEE计算 + VSM图 + SMED跟踪 + 瓶颈识别 | T05 | 10 |
| T13 | 质量成本：PAF分析 + SPC控制图 + 不良品追溯 | T05 | 8 |
| T14 | 后端API：生产 + 质量全接口 | T02,T12,T13 | 6 |

### Phase 5：激励中心 + 收尾 [Task 16-18]

| ID | 任务 | 依赖 | 预估文件数 |
|----|------|------|-----------|
| T15 | 激励中心：分享计算器 + 提案管理 + 排行榜 + 认证 | T05 | 8 |
| T16 | 后端API：激励中心全接口 | T02,T15 | 4 |
| T17 | 全局一致性审查：联调测试、修复问题 | T07-T16 | - |
| T18 | README + 启动文档 | T17 | 1 |

**总计预估：约 105 个文件**

---

## 七、共享约定

### 7.1 代码风格
- **前端**：使用 `<script setup>` 组合式API，组件名 PascalCase，变量 camelCase
- **后端**：CommonJS模块，async/await，错误统一通过 next(err) 抛出
- **命名**：
  - API路径：kebab-case (`/api/cost-accounting/overview`)
  - 数据库字段：snake_case (`unit_cost`, `created_at`)
  - 前端组件：PascalCase (`CostOverview.vue`)

### 7.2 错误码规范
| code范围 | 含义 |
|----------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录/Token过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 1001-1999 | 业务自定义错误 |

### 7.3 分页约定
所有列表接口统一分页参数：
```
GET /api/xxx?page=1&pageSize=20&keyword=&sortField=&sortOrder=
```
响应：
```json
{
  "code": 200,
  "data": {
    "list": [...],
    "total": 150,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 八、待明确事项

| # | 问题 | 建议 | 影响 |
|---|------|------|------|
| 1 | 是否需要多租户？ | V1单租户，V2再加 | 数据模型需加tenant_id |
| 2 | 文件存储？ | 本地uploads目录即可 | OSS集成延后 |
| 3 | 操作日志审计？ | 基础日志表，关键操作记录 | 加audit_logs表 |

---

> 下一步：将本文档交给工程师（寇豆码），按任务分解顺序批量编写代码。
