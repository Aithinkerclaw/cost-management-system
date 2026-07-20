# 精益成本管控系统 — 商业化部署方案（双轨制）

## 一、背景与目标

### 1.1 现状
- 当前系统为**单企业版**，一套代码服务一家公司
- 已完成 RBAC 多角色权限体系（8角色 × 8模块 × 3级别）
- 部署在阿里云 47.113.216.193，SQLite 存储

### 1.2 目标
支持**两种商业化模式并行**，同一套代码通过配置切换：

| 模式 | 说明 | 收费方式 | 适用客户 |
|------|------|---------|---------|
| **源码部署版** | 客户自己服务器部署 | 一次性买断 / 年费制 | 大中型企业、数据敏感型 |
| **SaaS 云端版** | 托管在云端，多租户共享 | 按账号数/按月付费 | 中小企业、快速上手 |

**核心原则：一套代码、两个模式、配置切换**

```
                    ┌─────────────────────────────┐
                    │     同一份源码 (One Codebase) │
                    └──────────┬──────────────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
    ┌────────────────────┐      ┌─────────────────────────┐
    │  源码部署模式        │      │   SaaS 云端模式           │
    │  DEPLOY_MODE =      │      │   DEPLOY_MODE =          │
    │  "standalone"       │      │   "saas"                  │
    ├────────────────────┤      ├─────────────────────────┤
    │ · 单租户运行        │      │ · 多租户 + 数据隔离       │
    │ · 无总后台入口      │      │ · 平台总后台管理所有租户   │
    │ · 客户自管数据库     │      │ · 套餐/账号/计费管理      │
    │ · 功能全量开放      │      │ · 套餐控制功能开关         │
    │ · 类似现在的样子     │      │ · 平台运营数据分析         │
    └────────────────────┘      └─────────────────────────┘
```

### 1.3 目标客户
- **年产值 1000万~5亿的制造型中小企业**
- 老板/总经理（决策者）采购，多部门员工使用
- 预期首年 50~200 家付费企业租户

---

## 二、核心概念定义

```
┌─────────────────────────────────────────────────────┐
│                   SaaS 平台                         │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 租户A     │  │ 租户B     │  │ 租户C     │  ...    │
│  │ XX制造厂  │  │ YY科技   │  │ ZZ工贸   │          │
│  │ (独立数据) │  │ (独立数据) │  │ (独立数据) │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       └──────────────┼──────────────┘                │
│                      ▼                               │
│              ┌──────────────┐                        │
│              │  平台总后台   │  ← 只有平台管理员能进   │
│              │  (超级管理)   │                        │
│              └──────────────┘                        │
└─────────────────────────────────────────────────────┘
```

| 概念 | 说明 | 示例 |
|------|------|------|
| **平台管理员** | SaaS平台运营者，管理所有租户 | admin（你） |
| **租户（Tenant）** | 每个付费企业客户 | XX制造厂 |
| **租户管理员** | 企业内部的管理员（老板/IT） | boss 角色 |
| **租户用户** | 企业内普通员工 | zhangsan/lisi 等 |
| **套餐（Plan）** | 定价方案，决定功能配额 | 免费版/专业版/企业版 |

---

## 二点五、双轨制商业模式详解

### 2.5.1 源码部署版（Standalone）

**客户画像：** 年产值 5亿+、有 IT 团队、对数据安全要求高的大中型企业

| 项目 | 说明 |
|------|------|
| **交付物** | 完整源码 + 一键部署脚本 + 安装文档 |
| **部署位置** | 客户自有服务器 / 私有云 |
| **数据存储** | 客户本地数据库（SQLite / MySQL 可选） |
| **功能范围** | 全部模块开放（8 大业务模块 + RBAC） |
| **总后台** | ❌ 不启用（单租户模式） |
| **用户数限制** | 无限制（客户自管） |
| **升级方式** | 手动更新或提供升级补丁包 |

**定价参考：**

| 版本 | 价格 | 包含内容 |
|------|------|---------|
| 基础版 | ¥9,800/永久 | 成本核算 + 库存控制 + RBAC |
| 标准版 | ¥29,800/永久 | 全部模块 + 数据导入导出 |
| 企业版 | ¥59,800/永久 | 全部模块 + 定制开发(3人天) + 1年维保 |
| 年度维保 | ¥9,800/年 | 远程技术支持 + 版本更新 + Bug修复 |

### 2.5.2 SaaS 云端版（Multi-Tenant）

**客户画像：** 年产值 1000万~5亿的中小企业，IT能力弱、想快速上手

| 项目 | 说明 |
|------|------|
| **访问方式** | 浏览器登录，无需部署 |
| **部署位置** | 你的阿里云服务器 |
| **数据存储** | 共享数据库（tenant_id 隔离） |
| **功能范围** | 按套餐分级开放 |
| **总后台** | ✅ 启用（你管理所有租户） |
| **用户数限制** | 按套餐配额 |
| **升级方式** | 平台统一更新，所有租户即时生效 |

**定价参考：**

| 套餐 | 月付 | 年付 | 用户上限 | 开放模块 |
|------|------|------|---------|---------|
| 免费试用 | ¥0 | ¥0 | 3人 | 成本核算 + Dashboard（30天） |
| 专业版 | ¥299/月 | ¥2,990/年 | 20人 | +采购/库存/质量成本 |
| 企业版 | ¥999/月 | ¥9,990/年 | 不限 | 全部模块 + API + 定制报表 |
| 账号扩展 | ¥20/人/月 | — | 每增1人 | — |

### 2.5.3 两种模式对比

```
┌────────────────────┬──────────────────┬──────────────────┐
│      对比维度       │   源码部署版      │   SaaS 云端版     │
├────────────────────┼──────────────────┼──────────────────┤
│ 首次付费           │ ¥9,800~59,800    │ ¥0 (免费试用)    │
│ 持续费用           │ 可选维保          │ ¥299~999/月      │
│ 部署难度           │ 需技术人员        │ 零部署即开即用     │
│ 数据主权           │ 完全自控          │ 托管在你服务器     │
│ 功能更新           │ 手动跟进          │ 自动同步最新版本   │
│ 定制开发           │ 改源码即可         │ 受限于SaaS架构     │
│ 适合企业规模       │ 中大型            │ 中小型            │
│ 运营成本           │ 低（一次性）      │ 高（持续运维）     │
│ 客单价             │ 高               │ 低但量大          │
└────────────────────┴──────────────────┴──────────────────┘
```

### 2.5.4 技术实现：模式切换开关

```javascript
// backend/config/index.js 或 .env 文件
const DEPLOY_MODE = process.env.DEPLOY_MODE || 'standalone'; // 'standalone' | 'saas'

module.exports = {
  DEPLOY_MODE,
  isSaaS: DEPLOY_MODE === 'saas',
  isStandalone: DEPLOY_MODE === 'standalone',
};
```

**代码中的条件加载逻辑：**

```javascript
// backend/app.js - 条件注册路由
const { isSaaS } = require('./config');

// 所有模式下都加载的业务路由
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/cost-accounting', ...);
// ... 其他业务路由

// 仅 SaaS 模式才加载的总后台路由
if (isSaaS) {
  app.use('/platform/auth', require('./routes/platform/auth'));
  app.use('/platform/tenants', require('./platform/routes/tenants'));
  app.use('/platform/plans', require('./platform/routes/plans'));
  app.use('/platform/users', require('./platform/routes/users'));
  app.use('/platform/analytics', require('./platform/routes/analytics'));
  app.use('/platform/settings', require('./platform/routes/settings'));
  app.use('/platform/audit-log', require('./platform/routes/audit-log'));
}

// SaaS 模式下增加 tenant_id 过滤中间件
if (isSaaS) {
  app.use('/api', require('./middleware/tenant-isolation'));
}
```

```javascript
// frontend/src/router/index.js - 条件注册路由
import { isSaaSMode } from '@/config';

const routes = [
  // 租户端路由（所有模式都有）
  { path: '/login', component: LoginView },
  { path: '/', component: MainLayout, children: [ ... ] },
];

// 仅 SaaS 模式才有平台总后台路由
if (isSaaSMode) {
  routes.push({
    path: '/platform',
    component: PlatformLayout,
    meta: { requiresPlatformAuth: true },
    children: [
      { path: '', redirect: '/platform/dashboard' },
      { path: 'dashboard', component: () => import('@/views/platform/dashboard/PlatformDashboard.vue') },
      { path: 'tenants', component: () => import('@/views/platform/tenants/TenantList.vue') },
      { path: 'plans', component: () => import('@/views/platform/plans/PlanManage.vue') },
      // ...
    ],
  });
}
```

---

## 三、平台总后台功能模块

### 模块总览

```
平台总后台 (Platform Admin Console)
├── 📊 数据驾驶舱        ← 全局运营概览
├── 🏢 租户管理          ← 核心模块：CRUD + 状态控制
├── 💰 套餐管理          ← 定价方案配置
├── 👥 平台用户管理      ← 平台级操作员账号
├── 📈 运营分析          ← 收费/活跃/流失数据
├── 🔧 系统设置          ← 全局配置/公告/功能开关
└── 📋 操作日志          ← 审计追踪
```

### 3.1 数据驾驶舱（Dashboard）

| 指标卡片 | 说明 |
|---------|------|
| 总租户数 / 本月新增 | 租户总量和增长趋势 |
| 活跃租户数（近30天有登录） | 健康度指标 |
| 总用户数 / 月活用户 | 用户规模 |
| 预估月收入（按套餐单价 × 租户数） | 收入概览 |

**图表：**
- 近12月租户增长趋势图
- 套餐分布饼图（各版本占比）
- Top10 活跃租户排行

### 3.2 租户管理（Tenant Management）— 核心模块

**列表页字段：**

| 字段 | 说明 |
|------|------|
| 租户ID / 公司全称 | 主键 |
| 联系人 / 手机 | 主要负责人 |
| 所在行业 | 制造细分领域 |
| 当前套餐 | 免费版/专业版/企业版 |
| 用户数 / 上限 | 已用/配额 |
| 到期时间 | 付费截止日 |
| 状态 | 正常/停用/过期/试用中 |
| 创建时间 | 注册时间 |
| 操作 | 查看/编辑/停用/进入租户后台(模拟登录) |

**功能清单：**

| 功能 | 说明 |
|------|------|
| 新建租户 | 手动录入企业信息，分配初始套餐 |
| 编辑租户 | 修改公司信息、调整套餐、延期 |
| 停用/启用 | 冻结租户（全员无法登录）|
| 删除租户 | ⚠️ 危险操作，需二次确认+数据清理 |
| 模拟登录 | 以租户管理员身份进入该企业后台（客服排查用）|
| 重置租户密码 | 重置租户管理员密码 |
| 数据概览 | 快速查看该租户的用户数、数据量、活跃度 |

### 3.3 套餐管理（Plan Management）

**预定义三档套餐：**

| 维度 | 免费版（试用） | 专业版 | 企业版 |
|------|--------------|--------|--------|
| 价格 | ¥0 | ¥299/月 | ¥999/月 |
| 用户数上限 | 3人 | 20人 | 不限 |
| 数据保留 | 30天 | 永久 | 永久 |
| 成本核算 | ✅ | ✅ | ✅ |
| 采购管理 | ❌ | ✅ | ✅ |
| 库存控制 | ❌ | ✅ | ✅ |
| 生产精益 | ❌ | ❌ | ✅ |
| 质量成本 | ❌ | ❌ | ✅ |
| 激励中心 | ❌ | ❌ | ✅ |
| API接口 | ❌ | ❌ | ✅ |
| 技术支持 | 社区 | 工单 | 专属顾问 |
| 自定义报表 | ❌ | ❌ | ✅ |

**功能：** 套餐 CRUD、功能开关配置、价格调整

### 3.4 平台用户管理（Platform Users）

| 字段 | 说明 |
|------|------|
| 用户名 | 平台后台登录账号 |
| 姓名 | 真实姓名 |
| 角色 | 超级管理员 / 运营人员 |
| 状态 | 正常/禁用 |
| 最后登录 | 时间 + IP |

> 注意：这是**平台级**账号，不是租户内的账号。通常只有 1~3 人。

### 3.5 运营分析（Analytics）

| 分析维度 | 内容 |
|---------|------|
| 收费趋势 | 月度 MRR/ARR 趋势图 |
| 租户留存 | 月留存率/流失率曲线 |
| 模块使用热度 | 各功能模块使用频次排行 |
| 行业分布 | 移户所在行业占比 |
| 转化漏斗 | 注册→试用→付费转化率 |

### 3.6 系统设置（System Settings）

| 配置项 | 说明 |
|-------|------|
| 平台公告 | 全局通知（登录后弹窗显示）|
| 功能开关 | 新功能灰度发布控制 |
| 注册方式 | 开放注册/邀请码/仅后台创建 |
| 试用天数 | 新租户默认试用期长度 |
| 系统参数 | 文件上传限制、会话超时等 |

### 3.7 操作日志（Audit Log）

记录平台管理员的关键操作：
- 租户创建/编辑/停用/删除
- 套餐变更
- 用户权限调整
- 模拟登录

字段：操作人、操作时间、操作类型、目标对象、详情（JSON）、IP地址

---

## 四、技术架构设计

### 4.1 整体架构（双模式）

```
┌─────────────────────────────────────────────────────────────────┐
│                    同一份代码 (One Codebase)                     │
│                                                                 │
│   DEPLOY_MODE = .env 配置切换                                    │
└─────────────────────────┬───────────────┬───────────────────────┘
                          │               │
          ┌───────────────▼──┐   ┌───────▼──────────────┐
          │  standalone 模式   │   │   saas 模式           │
          │                   │   │                       │
          │  ┌─────────────┐  │   │  ┌─────────────────┐  │
          │  │ 前端 SPA     │  │   │  │ Nginx 反向代理    │  │
          │  └──────┬──────┘  │   │  │ /admin → 总后台   │  │
          │         │         │   │  │ /      → 租户     │  │
          │  ┌──────▼──────┐  │   │  └───────┬──────────┘  │
          │  │ Express API  │  │   │          │              │
          │  │ (无总后台路由) │  │   │  ┌──────▼──────────┐  │
          │  └──────┬──────┘  │   │  │ Express API       │  │
          │         │         │   │  │ ├ /platform/*     │  │
          │  ┌──────▼──────┐  │   │  │ ├ /api/* (隔离)   │  │
          │  │ SQLite/MySQL │  │   │  │ └ tenant过滤中间件│  │
          │  │ (单租户数据)  │  │   │  └───────┬──────────┘  │
          │  └─────────────┘  │   │          │              │
          │                   │   │  ┌──────▼──────────┐  │
          │  ✅ 功能全量开放    │   │  │ SQLite (多租户)   │  │
          │  ❌ 无租户概念     │   │  │ +tenant_id 隔离    │  │
          │  ❌ 无套餐限制     │   │  └──────────────────┘  │
          └───────────────────┘   └───────────────────────┘
```

### 4.2 数据库 Schema 变更

#### 新增表

```sql
-- ============================
-- 1. 租户表（核心新表）
-- ============================
CREATE TABLE tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_code TEXT UNIQUE NOT NULL,          -- 租户编码 如 'tenant_001'
  company_name TEXT NOT NULL,                 -- 企业全名
  short_name TEXT,                            -- 简称（用于页面展示）
  industry TEXT,                              -- 所属行业
  contact_person TEXT,                        -- 联系人
  contact_phone TEXT,                         -- 联系电话
  email TEXT,                                 -- 企业邮箱
  address TEXT,                               -- 企业地址
  plan_id INTEGER DEFAULT 1,                  -- 关联套餐ID
  expire_date DATE,                           -- 到期时间（NULL=永久/按需）
  status TEXT DEFAULT 'active',               -- active/suspended/expired/trial
  max_users INTEGER DEFAULT 3,                -- 用户数上限
  notes TEXT,                                 -- 备注
  created_by INTEGER,                         -- 创建人（平台管理员ID）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 2. 套餐表
-- ============================
CREATE TABLE plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_code TEXT UNIQUE NOT NULL,             -- free/pro/enterprise
  plan_name TEXT NOT NULL,                     -- 免费版/专业版/企业版
  price_monthly REAL DEFAULT 0,                -- 月付价格
  price_yearly REAL DEFAULT 0,                 -- 年付价格
  max_users INTEGER DEFAULT 3,                 -- 用户数上限
  data_retention_days INTEGER DEFAULT 30,      -- 数据保留天数
  features TEXT DEFAULT '{}',                  -- JSON: 功能开关配置
  sort_order INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 3. 平台用户表（区别于租户内 users 表）
-- ============================
CREATE TABLE platform_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  real_name TEXT NOT NULL,
  role TEXT DEFAULT 'staff',                  -- super_admin/operator
  phone TEXT,
  last_login_at DATETIME,
  last_login_ip TEXT,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 4. 操作日志表
-- ============================
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operator_id INTEGER,                        -- 操作人（platform_users.id）
  operator_name TEXT,                         -- 操作人姓名（冗余防删）
  action TEXT NOT NULL,                       -- tenant.create/user.update 等
  target_type TEXT,                           -- tenant/user/plan
  target_id INTEGER,                          -- 目标对象ID
  detail TEXT,                                -- JSON 详情
  ip TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 现有表变更（加 `tenant_id`）

需要对以下**所有业务表**增加 `tenant_id` 列：

```sql
-- 所有业务表都加这列
ALTER TABLE users ADD COLUMN tenant_id INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN tenant_id INTEGER DEFAULT 1;
ALTER TABLE bom_items ADD COLUMN tenant_id INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN tenant_id INTEGER DEFAULT 1;
ALTER TABLE suppliers ADD COLUMN tenant_id INTEGER DEFAULT 1;
ALTER TABLE purchase_orders ADD COLUMN tenant_id INTEGER DEFAULT 1;
ALTER TABLE materials ADD COLUMN tenant_id INTEGER DEFAULT 1;
ALTER TABLE inventory_records ADD COLUMN tenant_id INTEGER DEFAULT 1;
ALTER TABLE oee_records ADD COLUMN tenant_id INTEGER DEFAULT 1;
ALTER TABLE quality_costs ADD COLUMN tenant_id INTEGER DEFAULT 1;
ALTER TABLE improvement_proposals ADD COLUMN tenant_id INTEGER DEFAULT 1;
ALTER TABLE incentive_rules ADD COLUMN tenant_id INTEGER DEFAULT 1;

-- roles 和 role_permissions 是全局共享的（所有租户共用同一套角色体系）
-- 不需要加 tenant_id
```

> **注意：** `DEFAULT 1` 表示迁移时将现有数据归属到 ID=1 的默认租户（即当前这家企业），确保平滑升级。

### 4.3 认证架构升级

```
当前（单租户）：          未来（SaaS多租户）：

用户 → 登录 → JWT        平台管理员 → /platform/login → Platform JWT
  ↓                       ↓
  业务 API                租户用户   → /api/auth/login  → Tenant JWT
                           ↓ (JWT payload 含 tenant_id)
                           业务 API（中间件自动过滤 tenant_id）
```

**JWT Payload 对比：**

```javascript
// 当前
{ userId: 1, username: "admin", roleCode: "super_admin" }

// 租户用户（未来）
{
  userId: 1,
  username: "zhangsan",
  tenantId: 5,
  tenantCode: "tenant_005",
  roleCode: "staff"
}

// 平台管理员（未来）
{
  platformUserId: 1,
  username: "saas_admin",
  role: "super_admin",
  isPlatformAdmin: true
}
```

### 4.4 API 路由规划

```
/api/platform/
├── POST   /auth/login              # 平台管理员登录
├── GET    /auth/profile            # 平台管理员个人信息
├── GET    /dashboard/stats         # 总后台驾驶舱数据
├── CRUD   /tenants                 # 租户管理
├── GET    /tenants/:id/stats       # 单个租户数据概览
├── POST   /tenants/:id/login-as    # 模拟登录租户
├── CRUD   /plans                   # 套餐管理
├── CRUD   /users                   # 平台用户管理
├── GET    /analytics/revenue       # 收入分析
├── GET    /analytics/retention     # 留存分析
├── GET    /analytics/usage         # 使用量分析
├── CRUD   /settings                # 系统设置
├── GET    /audit-logs              # 操作日志查询

/api/* （现有租户业务API，保持不变，中间件自动注入 tenant_id 过滤）
```

### 4.5 前端架构方案

**推荐方案：同一前端项目，两套入口**

```
frontend/src/
├── views/
│   ├── platform/          ← 🆕 平台总后台页面
│   │   ├── layout/
│   │   │   └── PlatformLayout.vue    # 总后台布局（不同配色/Logo）
│   │   ├── dashboard/
│   │   │   └── PlatformDashboard.vue # 总驾驶舱
│   │   ├── tenants/
│   │   │   ├── TenantList.vue        # 租户列表
│   │   │   └── TenantDetail.vue      # 租户详情/编辑
│   │   ├── plans/
│   │   │   └── PlanManage.vue        # 套餐管理
│   │   ├── users/
│   │   │   └── PlatformUserManage.vue# 平台用户管理
│   │   ├── analytics/
│   │   │   └── AnalyticsView.vue     # 运营分析
│   │   ├── settings/
│   │   │   └── SystemSettings.vue    # 系统设置
│   │   └── audit-log/
│   │       └── AuditLogView.vue      # 操作日志
│   ├── login/
│   │   └── LoginView.vue    # 改造：支持"平台管理入口"切换
│   └── ... (现有租户业务页面不变)
```

**登录改造：**
- 默认登录页 = 租户登录（现有逻辑）
- 页面底部增加「平台管理入口」链接 → 跳转到 `/platform/login`
- 或通过独立路径 `/admin` 访问总后台登录页

### 4.6 部署拓扑（双模式演进路线）

```
阶段一（当前 ✅ 已完成）：单租户 standalone 模式
  DEPLOY_MODE=standalone
  一个前端 + 一个后端 + SQLite
  功能全量开放，无租户概念

阶段二（🚧 下一步）：
  加入 DEPLOY_MODE 开关，代码兼容两种模式
  SaaS模式：数据库加 tenant_id + 总后台页面
  Standalone模式：行为不变，保持现有体验

阶段三（SaaS 运营期）：
  你的云端服务器跑 saas_mode → 服务 N 个中小企业租户
  大客户购买源码 → 自己部署 standalone_mode

阶段四（未来扩展）：
  可选：Standalone 版支持 MySQL/PostgreSQL（大客户需要）
  可选：SaaS 版 Redis 缓存层 + 支付宝/微信支付接入
  可选：SaaS 版每个大租户独立数据库（分库方案）
```

### 4.7 部署交付物清单

**源码部署版交付包：**
```
cost-mgmt-v2.0/
├── backend/                  # 后端源码
│   ├── config/
│   │   └── .env.example      # 含 DEPLOY_MODE=standalone
│   ├── db/
│   │   ├── schema.sql        # 建表脚本（无 tenant_id）
│   │   └── seed.js           # 初始数据
│   ├── app.js
│   └── package.json
├── frontend/                 # 前端源码
│   └── src/
│       └── config/
│           └── index.js      # isSaaSMode = false (默认)
├── scripts/
│   ├── install.bat / .sh     # 一键安装脚本（检测Node环境+依赖+建表）
│   ├── start.bat / .sh       # 启动服务
│   └── upgrade.bat / .sh     # 升级脚本
├── nginx.conf.example        # Nginx 配置模板
├── DEPLOY.md                 # 部署文档（图文步骤）
└── README.md                 # 产品说明
```

**SaaS 云端版：** 直接在你阿里云上运行同一份代码，仅改 `.env` 中 `DEPLOY_MODE=saas`

---

## 五、实施计划（分阶段）

### Phase 1️⃣：数据库 + 租户隔离内核（优先级最高）

**目标：** 在不破坏现有功能的前提下，加入多租户数据隔离能力

| 步骤 | 内容 | 预估工作量 |
|------|------|-----------|
| 1.1 | 新增 tenants/plans/platform_users/audit_logs 4张表 | 0.5天 |
| 1.2 | 所有业务表加 tenant_id 列 + 迁移脚本 | 0.5天 |
| 1.3 | 改造 auth 中间件，JWT 加入 tenantId | 0.5天 |
| 1.4 | 改造所有业务路由的查询，WHERE 条件加 tenant_id | 1天 |
| 1.5 | 编写种子数据（默认租户 + 3档套餐 + 平台管理员） | 0.5天 |

**交付物：** 后端支持多租户查询隔离，前端无需改动

### Phase 2️⃣：平台总后台 API + 前端页面

**目标：** 实现可用的平台管理界面

| 步骤 | 内容 | 预估工作量 |
|------|------|-----------|
| 2.1 | 平台认证 API（登录/Profile/改密） | 0.5天 |
| 2.2 | 租户管理 API（CRUD + 统计 + 模拟登录） | 1天 |
| 2.3 | 套餐管理 API | 0.5天 |
| 2.4 | 平台用户管理 API | 0.5天 |
| 2.5 | 总后台驾驶舱 API | 0.5天 |
| 2.6 | 操作日志中间件 + API | 0.5天 |
| 2.7 | PlatformLayout + 侧边栏/头部 | 0.5天 |
| 2.8 | 租户管理页面（列表 + 详情/编辑） | 1天 |
| 2.9 | 套餐管理页面 | 0.5天 |
| 2.10 | 驾驶舱页面 | 0.5天 |
| 2.11 | 其他页面（日志/设置/用户/分析） | 1天 |
| 2.12 | 登录页改造（双入口） | 0.5天 |

**交付物：** 完整的平台总后台界面

### Phase 3️⃣：租户自服务 + 商业化能力

**目标：** 让租户能自主管理，具备收费基础能力

| 步骤 | 内容 | 预估 |
|------|------|------|
| 3.1 | 租户注册/开通流程 | 0.5天 |
| 3.2 | 套餐功能开关（前端根据套餐隐藏模块） | 1天 |
| 3.3 | 用户数配额检查（超限提示升级） | 0.5天 |
| 3.4 | 试用到期提醒 | 0.5天 |

**交付物：** 具备商业化基本能力的 SaaS 产品

---

## 六、关键设计决策（FAQ）

### Q1：双模式切换会不会让代码变得很复杂？
**A:** 不会。核心策略是**功能开关 + 条件注册**：
- 后端通过 `if (isSaaS)` 判断是否加载总后台路由和租户中间件
- 前端通过 `isSaaSMode` 配置决定是否打包 `/platform/*` 路由
- Standalone 模式下，总后台代码**不会被加载**（零开销）
- 两种模式共用 95%+ 的业务代码

### Q2：源码部署版和 SaaS 版的数据结构一样吗？
**A:** 基本一致，但有一点差异：
- **Standalone 版**：业务表**没有 tenant_id** 列，更简洁
- **SaaS 版**：业务表**有 tenant_id** 列
- 通过建表脚本 (`schema.sql`) 区分：检测 `DEPLOY_MODE` 选择执行哪套 DDL
- 新增的 tenants/plans/audit_logs 等表仅 SaaS 版创建

### Q3：为什么选择「共享库 + tenant_id」而不是「每租户一库」？
**A:** 当前使用 SQLite，单文件数据库，分库成本高且运维复杂。对于 200 家以内的租户规模，共享库 + tenant_id 足够。源码部署版的大客户如果需要，未来可支持 MySQL 独立实例。

### Q4：平台总后台和租户后台是同一个前端吗？
**A:** 推荐**同一个前端工程，不同路由前缀**。开发效率高，共享组件和工具函数。通过 `/platform/*` 和路由守卫区分两套 UI。Standalone 模式下不打包总后台路由。

### Q5：现有的 RBAC 角色体系和新的租户体系是什么关系？
**A:** 两层关系——
- **第一层（平台级，仅 SaaS）：** 区分「平台管理员」vs「租户用户」
- **第二层（租户级，两种模式都有）：** 现有 RBAC 8 角色不变，在每个租户内部生效
- 即：roles / role_permissions 表是**全局共享**的，不加 tenant_id

### Q6：模拟登录安全吗？
**A:** 模拟登录生成的是目标租户管理员的临时 Token，操作会被 audit_log 记录，且 Token 有效期较短（建议 1 小时）。仅限平台管理员使用。（仅 SaaS 模式有此功能）

### Q7：需要对接支付吗？
**A:** Phase 1~2 不需要。先做好手动开通/续费的流程。Phase 3 可考虑对接支付宝/微信自助支付。

### Q8：客户买断源码后会不会转手倒卖？
**A:** 常见做法——
- 代码加混淆/授权校验（绑定域名或机器码）
- 或者：开源核心版（基础功能）+ 付费企业版（高级功能）
- 或者：完全信任客户，靠服务维保盈利（像 Odoo 社区版 vs 企业版）
- 建议**初期不用太担心**，先跑通商业闭环再考虑代码保护

---

## 七、UI 设计要点

### 三种界面形态

| 维度 | 源码部署版（Standalone） | SaaS 租户端 | SaaS 平台总后台 |
|------|------------------------|-------------|-----------------|
| 主色调 | 蓝色 (#409EFF) | 蓝色 (#409EFF) | 深紫色 (#6C5CE7) |
| Logo | 客户自定义或默认 | 企业自定义或默认 | 「精益管控 SaaS 平台」品牌 Logo |
| 登录页 | 标准企业登录 | 标准企业登录（带品牌） | 单独的管理入口 |
| 侧边栏 | 全部业务模块 | 套餐控制的模块可见 | 租户/套餐/运营等管理菜单 |
| 套餐水印/提示 | 无 | 可能有「升级套餐」入口 | 无 |
| 功能范围 | 全部开放 | 按 plan 控制 | 管理功能全量 |

### 平台总后台视觉区分
| 维度 | 租户后台（现有） | 平台总后台（新建） |
|------|-----------------|-------------------|
| 主色调 | 蓝色 (#409EFF) | 深紫色 (#6C5CE7) 或靛蓝 (#5849BE) |
| Logo | 企业自定义或默认 | 「精益管控 SaaS 平台」品牌 Logo |
| 登录页 | 企业登录 | 单独的管理入口（无默认账号提示）|
| 侧边栏 | 业务模块菜单 | 租户/套餐/运营等管理菜单 |

这样即使同一浏览器打开两个 tab，也能一眼区分。
