const { initDatabase, getDb } = require('./config/database');
initDatabase();
const db = getDb();

// 查看现有角色
const roles = db.prepare('SELECT role_code FROM roles').all();
console.log('现有角色：', roles.map(r => r.role_code).join(', '));

// 为每个角色添加 design 权限（如果还没有）
let added = 0;
roles.forEach(role => {
  const exists = db.prepare('SELECT 1 FROM role_permissions WHERE role_code = ? AND module_code = ?').get(role.role_code, 'design');
  if (!exists) {
    db.prepare('INSERT INTO role_permissions (role_code, module_code, access_level) VALUES (?, ?, ?)').run(role.role_code, 'design', 'full');
    console.log(`✅ 已为角色 ${role.role_code} 添加 design 权限`);
    added++;
  } else {
    console.log(`⏭ 角色 ${role.role_code} 已有 design 权限，跳过`);
  }
});

if (added === 0) {
  console.log('ℹ️ 所有角色已有 design 权限，无需添加');
} else {
  console.log(`✅ 共添加 ${added} 条 design 权限记录`);
}
