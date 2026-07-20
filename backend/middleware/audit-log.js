/**
 * 操作日志中间件（仅 SaaS 模式生效）
 * 记录平台管理员的关键操作
 */
const { getDb } = require('../config/database');
const { isSaaS } = require('../config/index');

function auditLog(action) {
  return (req, res, next) => {
    if (!isSaaS) return next();

    // 保存原始 res.json
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      try {
        const operator = req.platformUser || {};
        if (operator.id && [200, 201, 204].includes(data.code)) {
          const db = getDb();
          db.prepare(`
            INSERT INTO audit_logs (operator_id, operator_name, action, target_type, target_id, detail, ip, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            operator.id,
            operator.realName || operator.username || 'system',
            action,
            req.params?.id ? req.path.split('/')[2] : action.split('.')[0],
            req.params?.id || null,
            JSON.stringify({ method: req.method, path: req.path, body: req.body || {} }),
            req.ip || req.connection?.remoteAddress,
            req.headers['user-agent']
          );
        }
      } catch (e) {
        console.error('[AuditLog] 写入失败:', e.message);
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * 手动记录日志（用于特殊场景）
 */
function logAction(operatorId, operatorName, action, targetType, targetId, detail) {
  if (!isSaaS) return;
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_logs (operator_id, operator_name, action, target_type, target_id, detail)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(operatorId, operatorName, action, targetType, targetId, typeof detail === 'string' ? detail : JSON.stringify(detail));
  } catch (e) {
    console.error('[AuditLog] 手动写入失败:', e.message);
  }
}

module.exports = { auditLog, logAction };
