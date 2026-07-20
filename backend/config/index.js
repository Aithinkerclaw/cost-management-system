/**
 * 部署模式配置
 * DEPLOY_MODE=standalone  → 源码部署版（单租户，功能全量开放）
 * DEPLOY_MODE=saas        → SaaS云端版（多租户，平台总后台管理）
 */
const DEPLOY_MODE = (process.env.DEPLOY_MODE || 'standalone').toLowerCase();

module.exports = {
  DEPLOY_MODE,
  isSaaS: DEPLOY_MODE === 'saas',
  isStandalone: DEPLOY_MODE === 'standalone'
};
