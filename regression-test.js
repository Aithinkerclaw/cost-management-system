const https = require('https');
const http = require('http');

const BASE_URL = 'http://47.113.216.193:3200';
let token = '';
let passed = 0;
let failed = 0;

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test(name, fn) {
  try {
    const result = await fn();
    if (result) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${name}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function runRegressionTest() {
  console.log('🧪 开始线上回归测试...\n');
  
  // 1. 健康检查
  await test('API健康检查', async () => {
    const res = await request('GET', '/api/health');
    return res.status === 200 && res.data.code === 200;
  });
  
  // 2. 登录
  await test('管理员登录', async () => {
    const res = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    if (res.status === 200 && res.data.code === 200) {
      token = res.data.data.token;
      return true;
    }
    return false;
  });
  
  // 3. 获取用户信息
  await test('获取当前用户信息', async () => {
    const res = await request('GET', '/api/auth/me', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200 && res.data.code === 200;
  });
  
  // 4. 仪表盘
  await test('仪表盘-成本趋势', async () => {
    const res = await request('GET', '/api/dashboard/cost-trend', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  await test('仪表盘-预警', async () => {
    const res = await request('GET', '/api/dashboard/alerts', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 5. 成本核算
  await test('成本核算-按订单', async () => {
    const res = await request('GET', '/api/cost-accounting/by-order', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 6. 采购管理
  await test('采购-供应商列表', async () => {
    const res = await request('GET', '/api/procurement/suppliers', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 7. 库存管理
  await test('库存-物料列表', async () => {
    const res = await request('GET', '/api/inventory/materials', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 8. 生产管理-OEE
  await test('生产-OEE记录列表', async () => {
    const res = await request('GET', '/api/production/oee', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 9. 质量成本（2026-06-15新增）
  await test('质量成本-标准分类', async () => {
    const res = await request('GET', '/api/quality-cost/list', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 10. 研发设计成本
  await test('研发设计-成本列表', async () => {
    const res = await request('GET', '/api/design-cost/list', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 11. 激励管理
  await test('激励-规则列表', async () => {
    const res = await request('GET', '/api/incentive/rules', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 12. 用户管理
  await test('用户管理-用户列表', async () => {
    const res = await request('GET', '/api/users', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 13. 角色权限
  await test('角色权限-角色列表', async () => {
    const res = await request('GET', '/api/roles', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 14. 成本科目（GB/T 46709）
  await test('成本科目-科目列表', async () => {
    const res = await request('GET', '/api/cost-accounts', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 15. 成本预算
  await test('成本预算-预算列表', async () => {
    const res = await request('GET', '/api/cost-budget', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 16. 成本核算方法
  await test('成本核算方法-列表', async () => {
    const res = await request('GET', '/api/cost-accounting-methods', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  // 17. 成本KPI
  await test('成本KPI-指标列表', async () => {
    const res = await request('GET', '/api/cost-kpi', null, {
      Authorization: `Bearer ${token}`
    });
    return res.status === 200;
  });
  
  console.log('\n=============================');
  console.log(`📊 测试完成: ${passed} 通过, ${failed} 失败`);
  console.log('=============================\n');
  
  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionTest().catch(console.error);
