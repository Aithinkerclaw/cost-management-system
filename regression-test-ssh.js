const { Client } = require('ssh2');

const HOST = '47.113.216.193';
const USER = 'root';
const PASS = 'Huang933@';

const TEST_SCRIPT = `
echo "🧪 开始线上回归测试（服务器本地）..."
echo ""

# 1. 健康检查
echo -n "测试1: API健康检查... "
RESULT=$(curl -s -o /tmp/regression_result -w "%{http_code}" http://127.0.0.1:3200/api/health)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 2. 登录
echo -n "测试2: 管理员登录... "
LOGIN_RESULT=$(curl -s -X POST http://127.0.0.1:3200/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}')
TOKEN=$(echo "$LOGIN_RESULT" | node -e "process.stdin.on('data', d => { const j = JSON.parse(d); if(j.code===200) console.log(j.data.token); })" )
if [ -n "$TOKEN" ]; then echo "✅ PASS"; else echo "❌ FAIL"; echo "$LOGIN_RESULT"; fi

# 3. 获取用户信息
echo -n "测试3: 获取当前用户信息... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/auth/me)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 4. 仪表盘-成本趋势
echo -n "测试4: 仪表盘-成本趋势... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/dashboard/cost-trend)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 5. 仪表盘-预警
echo -n "测试5: 仪表盘-预警... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/dashboard/alerts)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 6. 成本核算
echo -n "测试6: 成本核算-按订单... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/cost-accounting/by-order)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 7. 采购管理
echo -n "测试7: 采购-供应商列表... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/procurement/suppliers)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 8. 库存管理
echo -n "测试8: 库存-物料列表... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/inventory/materials)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 9. 生产管理-OEE
echo -n "测试9: 生产-OEE记录列表... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/production/oee)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 10. 质量成本
echo -n "测试10: 质量成本-标准分类... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/quality-cost/list)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 11. 研发设计成本
echo -n "测试11: 研发设计-成本列表... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/design-cost/list)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 12. 激励管理
echo -n "测试12: 激励-规则列表... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/incentive/rules)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 13. 用户管理
echo -n "测试13: 用户管理-用户列表... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/users)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 14. 角色权限
echo -n "测试14: 角色权限-角色列表... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/roles)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 15. 成本科目
echo -n "测试15: 成本科目-科目列表... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/cost-accounts)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 16. 成本预算
echo -n "测试16: 成本预算-预算列表... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/cost-budget)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 17. 成本核算方法
echo -n "测试17: 成本核算方法-列表... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/cost-accounting-methods)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

# 18. 成本KPI
echo -n "测试18: 成本KPI-指标列表... "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:3200/api/cost-kpi)
if [ "$RESULT" = "200" ]; then echo "✅ PASS"; else echo "❌ FAIL (HTTP $RESULT)"; fi

echo ""
echo "=============================="
echo "📊 回归测试完成"
echo "=============================="
`;

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH连接成功！');
  console.log('运行回归测试...\n');
  
  conn.exec(TEST_SCRIPT, (err, stream) => {
    if (err) { console.error('执行失败:', err.message); conn.end(); return; }
    
    stream.on('data', (data) => {
      process.stdout.write(data.toString());
    });
    
    stream.on('close', (code) => {
      console.log(`\n测试完成，退出码: ${code}`);
      conn.end();
    });
  });
});

conn.on('error', (err) => {
  console.error('SSH连接失败:', err.message);
  process.exit(1);
});

conn.connect({
  host: HOST,
  username: USER,
  password: PASS,
  readyTimeout: 30000
});
