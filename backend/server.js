const app = require('./app');
const { initDatabase } = require('./config/database');

const PORT = process.env.PORT || 3200;

// 初始化数据库
initDatabase();

app.listen(PORT, () => {
  console.log(`🚀 成本管理系统后端启动成功: http://localhost:${PORT}`);
  console.log(`   API地址: http://localhost:${PORT}/api`);
});
