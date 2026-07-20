# 精益成本管理平台

> 创新型中小企业成本管理系统 - 基于「1+6+1」功能架构的 SaaS 成本管理平台

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- 无需安装数据库（内置 SQLite）

### 1. 安装依赖

```bash
# 后端
cd backend && npm install

# 前端
cd ../frontend && npm install
```

### 2. 初始化数据

```bash
cd backend && node db/seed.js
```

默认账号：**admin** / **admin123**

### 3. 启动服务

```bash
# 终端1: 启动后端 (端口 3200)
cd backend && npm run dev

# 终端2: 启动前端 (端口 5173)
cd frontend && npm run dev
```

访问 **http://localhost:5173**

## 📐 功能架构（1+6+1）

| 模块 | 说明 |
|------|------|
| 🏠 **成本驾驶舱** | KPI指标、成本结构、趋势图、异常预警、改善动态 |
| 💰 **全价值链核算** | 材料成本、人工成本、ABC制造费用分摊、订单追溯 |
| 🛒 **采购管理** | 供应商QCDS管理、TCO总拥有成本分析、价格趋势、集采建议 |
| 📦 **库存控制** | ABC分类、安全库存计算器、呆滞物料预警、周转模拟 |
| ⚙️ **生产精益** | OEE在线计算、VSM价值流图、SMED换模跟踪、瓶颈识别 |
| ✅ **质量成本** | PAF四类成本归集与对标、SPC统计过程控制图、不良品追溯 |
| 🏆 **激励中心** | 增量分享计算器、改善提案全流程管理、积分排行榜 |

## 🔧 技术栈

- **前端**: Vue 3 + Vite + Element Plus + ECharts + Pinia + Vue Router
- **后端**: Express.js + SQLite3 (better-sqlite3) + JWT认证
- **部署**: 支持SaaS云部署 / Docker私有化部署

## 📁 项目结构

```
├── backend/          # Node.js 后端服务
│   ├── routes/       # API 路由 (8个模块)
│   ├── services/     # 业务逻辑层
│   ├── models/       # 数据模型
│   ├── db/           # 数据库初始化 & 种子数据
│   └── middleware/   # 中间件 (JWT认证/错误处理)
│
├── frontend/         # Vue 3 前端应用
│   └── src/
│       ├── views/    # 页面组件 (20+页面)
│       ├── api/      # API 封装
│       ├── stores/   # Pinia 状态管理
│       ├── router/   # 路由配置
│       └── components/# 公共组件
│
└── deliverables/     # 设计文档 (PRD / 架构设计)
```

## 🎨 UI 特性

- 深蓝色专业主题 (#1A73E8 主色)
- Element Plus 企业级组件库
- ECharts 数据可视化（环形图/折线图/柱状图/饼图/树形图）
- 响应式布局，适配 PC 和平板
- 左侧导航菜单，支持折叠

## 📄 文档

- [产品需求文档 PRD](./PRD-国家标准对齐-v2.0.md)
- [系统架构设计](./架构设计-v2.0.md)

---

*基于贝因咨询精益成本管理方法论体系开发*
