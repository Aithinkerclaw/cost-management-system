/**
 * 系统设置路由
 */
const express = require('express');
const { getDb } = require('../../config/database');
const { isSaaS } = require('../../config/index');
const { verifyPlatformToken } = require('./auth');
const { success, error } = require('../../utils/response');

const router = express.Router();
router.use(verifyPlatformToken);

// 获取设置（用 JSON 文本存，简单实现）
router.get('/', (req, res) => {
  if (!isSaaS) return res.json(error(403, '当前非 SaaS 模式'));
  const db = getDb();

  // 用一个简易方式：从 plans 表推断系统状态
  const tenantCount = db.prepare('SELECT COUNT(*) as cnt FROM tenants').get().cnt;
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM platform_users').get().cnt;

  // 系统信息
  const systemInfo = {
    mode: 'saas',
    version: '2.0.0',
    deployTime: db.prepare("SELECT MIN(created_at) as t FROM tenants").get()?.t || new Date().toISOString(),
    stats: { tenantCount, platformUserCount: userCount }
  };

  res.json(success(systemInfo));
});

module.exports = router;
