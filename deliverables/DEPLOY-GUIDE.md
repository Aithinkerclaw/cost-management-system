# 🚀 精益成本管理系统 - 阿里云部署指南

## 一、部署架构

```
阿里云 ECS (CentOS 7.9 / Ubuntu 20.04)
├── Nginx (反向代理, 端口 80/443)
│   ├── / → 前端静态文件 (dist/)
│   └── /api → 反向代理到 Node.js (端口 3200)
├── Node.js 后端服务 (端口 3200)
│   └── SQLite 数据库 (data/cost_management.db)
└── PM2 进程管理
```

## 二、服务器要求

| 配置 | 最低要求 | 推荐配置 |
|------|---------|---------|
| CPU | 1核 | 2核 |
| 内存 | 2G | 4G |
| 硬盘 | 40G | 50G SSD |
| 带宽 | 1Mbps | 3-5Mbps |
| 系统 | CentOS 7.9+ / Ubuntu 20.04+ | |

**预估成本**：约 50-100 元/月（按量付费或包年）

## 三、部署步骤

### Step 1: 服务器环境初始化

```bash
# SSH 登录服务器后执行
ssh root@你的公网IP

# 更新系统
yum update -y    # CentOS
# apt update && apt upgrade -y   # Ubuntu

# 安装基础工具
yum install -y git nginx wget    # CentOS
# apt install -y git nginx wget curl   # Ubuntu
```

### Step 2: 安装 Node.js 22.x

```bash
# 使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
node -v    # 应显示 v22.x.x
npm -v
```

### Step 3: 安装 PM2（进程管理）

```bash
npm install -g pm2
pm2 --version
```

### Step 4: 上传项目代码

**方法 A: Git 推荐方式**

```bash
# 在本地项目目录执行
cd C:\Users\Administrator\WorkBuddy\Claw\cost-management-system
git init
git add .
git commit -m "Initial commit: cost management system"

# 推送到 GitHub/Gitee，然后服务器上拉取
```

**方法 B: 直接打包上传（快速）**

```bash
# 本地打包（排除 node_modules 和 data）
cd C:/Users/Administrator/WorkBuddy/Claw/
tar --exclude='*/node_modules' --exclude='*/data' --exclude='*/dist' \
    --exclude='*/.git' -czvf cost-system-deploy.tar.gz cost-management-system/

# 用 SCP 上传到服务器
scp cost-system-deploy.tar.gz root@你的公网IP:/root/

# 服务器上解压
cd /root
tar -xzvf cost-system-deploy.tar.gz
mv cost-management-system /opt/cost-management-system
```

### Step 5: 安装依赖 + 构建

```bash
cd /opt/cost-management-system

# 后端依赖
cd backend && npm install --production
cd ..

# 前端构建
cd frontend && npm install && npm run build
cd ..
```

### Step 6: 初始化数据库

```bash
cd /opt/cost-management-system/backend
node db/seed.js
# 输出: ✅ 种子数据初始化完成!
```

### Step 7: 配置 Nginx

```bash
cat > /etc/nginx/conf.d/cost-management.conf << 'EOF'
server {
    listen 80;
    server_name 你的域名或公网IP;  # 例如: cms.yourdomain.com 或 47.96.xxx.xxx

    # 前端静态文件
    root /opt/cost-management-system/frontend/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;

    # API 反向代理到 Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Vue Router history 模式 fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx && systemctl enable nginx
```

### Step 8: 启动后端服务（PM2）

```bash
cd /opt/cost-management-system/backend

# 启动服务
pm2 start server.js --name "cost-api"

# 设置开机自启
pm2 save
pm2 startup

# 查看状态
pm2 status
pm2 logs cost-api --lines 20
```

### Step 9: 防火墙/安全组放行

**阿里云控制台操作**：

1. 进入 ECS 实例 → 安全组
2. 添加入方向规则：

| 端口 | 协议 | 来源 | 说明 |
|------|------|------|------|
| 80 | TCP | 0.0.0.0/0 | HTTP 访问 |
| 443 | TCP | 0.0.0.0/0 | HTTPS（可选） |
| 3200 | TCP | 127.0.0.1/32 | 仅本机访问（Nginx反代） |

⚠️ **重要**: 3200 端口不要对公网开放！只允许 127.0.0.1 访问

### Step 10: 可选 - 配置 HTTPS（免费 SSL）

```bash
# 安装 certbot
yum install -y certbot python2-certbot-nginx    # CentOS
# apt install -y certbot python3-certbot-nginx   # Ubuntu

# 自动申请并配置 Let's Encrypt 证书
certbot --nginx -d 你的域名

# 自动续期（已自动配置 cron）
certbot renew --dry-run
```

## 四、验证部署成功

```bash
# 本地测试 API
curl http://你的公网IP/api/health
# 返回: {"code":200,"message":"ok","data":{"timestamp":"..."}}

# 测试登录
curl -X POST http://你的公网IP/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

浏览器打开：**http://你的公网IP**
默认账号：`admin` / `admin123`

## 五、日常运维命令

```bash
# 查看服务状态
pm2 status
pm2 logs cost-api          # 查看日志
pm2 restart cost-api       # 重启
pm2 monit                  # 监控面板

# 更新代码
cd /opt/cost-management-system
git pull origin main       # 或重新上传解压
cd frontend && npm run build
pm2 restart cost-api

# 备份数据库
cp /opt/cost-management-system/data/cost_management.db \
   /root/backup/cost_$(date +%Y%m%d).db

# Nginx 相关
nginx -t                   # 测试配置
systemctl reload nginx     # 重载配置（不中断）
```

## 六、生产环境优化建议

1. **数据库**: SQLite 适合中小规模（<100并发），如需更高并发可迁移到 MySQL
2. **日志**: 配置 PM2 日志轮转，避免日志文件过大
3. **监控**: 配置阿里云云监控告警（CPU > 80%, 内存 > 85%）
4. **备份**: 设置定时备份脚本（cron 每天凌晨备份数据库）
5. **HTTPS**: 生产环境强烈建议开启 HTTPS

## 七、一键部署脚本（可选）

如果嫌步骤多，可以用这个一键脚本：

```bash
# 保存为 deploy.sh，在服务器上执行
#!/bin/bash
set -e
echo "🚀 开始部署精益成本管理系统..."

# 参数配置
PROJECT_DIR="/opt/cost-management-system"
DOMAIN="${1:-}"  # 第一个参数为域名（可选）

# 1. 安装 Node.js
if ! command -v node &>/dev/null; then
  echo "→ 安装 Node.js..."
  curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
  yum install -y nodejs
fi

# 2. 安装 PM2
npm install -g pm2 2>/dev/null

# 3. 安装依赖
echo "→ 安装依赖..."
cd "$PROJECT_DIR/backend" && npm install --production
cd ../frontend && npm install && npm run build

# 4. 初始化数据库
cd ../backend && node db/seed.js

# 5. 配置 Nginx
echo "→ 配置 Nginx..."
cat > /etc/nginx/conf.d/cost-management.conf << NGINX_EOF
server {
    listen 80;
    server_name ${DOMAIN:-_};
    root $PROJECT_DIR/frontend/dist;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    location /api/ {
        proxy_pass http://127.0.0.1:3200;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }
    location / { try_files \$uri \$uri/ /index.html; }
}
NGINX_EOF
nginx -t && systemctl restart nginx

# 6. 启动服务
cd "$PROJECT_DIR/backend"
pm2 delete cost-api 2>/dev/null || true
pm2 start server.js --name "cost-api"
pm2 save

echo ""
echo "✅ 部署完成！"
echo "   访问地址: http://${DOMAIN:-$(curl -s ifconfig.me)}"
echo "   默认账号: admin / admin123"
echo ""
pm2 status
```
