module.exports = {
  apps: [
    {
      name: 'cost-management-system',
      script: 'server.js',
      cwd: '/www/wwwroot/cost-management/backend',
      instances: 1,
      exec_mode: 'fork',

      // 环境变量（SaaS 多租户模式）
      env: {
        NODE_ENV: 'production',
        DEPLOY_MODE: 'saas',
        PORT: 3200
        // JWT_SECRET / PLATFORM_JWT_SECRET 从 .env 读取（不写在这里）
      },

      // 日志
      error_file: '/var/log/cost-management/error.log',
      out_file: '/var/log/cost-management/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // 自动重启
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // 优雅关闭
      kill_timeout: 5000
    }
  ]
};
