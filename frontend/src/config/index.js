/**
 * 前端部署模式配置
 */
const isSaaSMode = import.meta.env.VITE_DEPLOY_MODE === 'saas';

export { isSaaSMode };
