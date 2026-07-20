/**
 * 种子数据脚本 - 初始化演示数据（含RBAC角色权限 + SaaS多租户）
 * 用法: node db/seed.js
 */
const { initDatabase, getDb } = require('../config/database');
const { isSaaS } = require('../config/index');
const bcrypt = require('bcryptjs');

// 先初始化数据库
initDatabase();

function seed() {
  const db = getDb();

  // 清空旧数据（开发用）
  const tables = ['incentive_rules','improvement_proposals','quality_costs','oee_records',
    'inventory_records','purchase_orders','orders','bom_items','products',
    'materials','suppliers','role_permissions','users','roles'];
  if (isSaaS) tables.push('audit_logs','platform_users','tenants','plans');
  tables.forEach(t => { try { db.exec(`DELETE FROM ${t}`); } catch(e) {} });

  // 重置自增计数器
  try { db.exec('DELETE FROM sqlite_sequence'); } catch(e) {}

  console.log('🧹 已清空旧数据，自增计数器已重置');

  // === 角色数据 ===
  const roles = [
    { role_code: 'super_admin', role_name: '超级管理员', description: '系统运维管理，全权限', is_system: 1, sort_order: 1 },
    { role_code: 'owner', role_name: '企业老板/总经理', description: '企业决策者，全模块读写+审批', is_system: 1, sort_order: 2 },
    { role_code: 'finance_manager', role_name: '财务经理', description: '成本核算全权限，驾驶舱，质量成本，库存只读', is_system: 1, sort_order: 3 },
    { role_code: 'procurement_manager', role_name: '采购主管', description: '采购管理全权限，库存读写，成本核算只读', is_system: 1, sort_order: 4 },
    { role_code: 'production_manager', role_name: '生产主管', description: '生产精益全权限，质量成本读写，库存只读', is_system: 1, sort_order: 5 },
    { role_code: 'warehouse_manager', role_name: '仓管员', description: '库存控制全权限，其他模块只读', is_system: 1, sort_order: 6 },
    { role_code: 'quality_manager', role_name: '质量主管', description: '质量成本全权限，生产只读，库存只读', is_system: 1, sort_order: 7 },
    { role_code: 'staff', role_name: '普通员工', description: '驾驶舱只读，改善提案提交', is_system: 1, sort_order: 8 }
  ];
  const insertRole = db.prepare('INSERT INTO roles (role_code, role_name, description, is_system, sort_order) VALUES (?,?,?,?,?)');
  roles.forEach(r => insertRole.run(r.role_code, r.role_name, r.description, r.is_system, r.sort_order));
  console.log(`✅ 角色: ${roles.length} 个`);

  // === 权限数据 ===
  const moduleCodes = ['dashboard', 'cost', 'procurement', 'inventory', 'production', 'quality', 'incentive', 'system'];
  const permissions = [
    ...moduleCodes.map(m => ({ role_code: 'super_admin', module_code: m, access_level: 'full' })),
    ...moduleCodes.map(m => ({ role_code: 'owner', module_code: m, access_level: 'full' })),
    { role_code: 'finance_manager', module_code: 'dashboard', access_level: 'full' },
    { role_code: 'finance_manager', module_code: 'cost', access_level: 'full' },
    { role_code: 'finance_manager', module_code: 'quality', access_level: 'full' },
    { role_code: 'finance_manager', module_code: 'inventory', access_level: 'read' },
    { role_code: 'finance_manager', module_code: 'incentive', access_level: 'read' },
    { role_code: 'finance_manager', module_code: 'procurement', access_level: 'read' },
    { role_code: 'procurement_manager', module_code: 'dashboard', access_level: 'read' },
    { role_code: 'procurement_manager', module_code: 'procurement', access_level: 'full' },
    { role_code: 'procurement_manager', module_code: 'inventory', access_level: 'full' },
    { role_code: 'procurement_manager', module_code: 'cost', access_level: 'read' },
    { role_code: 'procurement_manager', module_code: 'incentive', access_level: 'read' },
    { role_code: 'production_manager', module_code: 'dashboard', access_level: 'read' },
    { role_code: 'production_manager', module_code: 'production', access_level: 'full' },
    { role_code: 'production_manager', module_code: 'quality', access_level: 'read' },
    { role_code: 'production_manager', module_code: 'inventory', access_level: 'read' },
    { role_code: 'production_manager', module_code: 'incentive', access_level: 'read' },
    { role_code: 'warehouse_manager', module_code: 'dashboard', access_level: 'read' },
    { role_code: 'warehouse_manager', module_code: 'inventory', access_level: 'full' },
    { role_code: 'warehouse_manager', module_code: 'procurement', access_level: 'read' },
    { role_code: 'warehouse_manager', module_code: 'cost', access_level: 'read' },
    { role_code: 'warehouse_manager', module_code: 'quality', access_level: 'read' },
    { role_code: 'quality_manager', module_code: 'dashboard', access_level: 'read' },
    { role_code: 'quality_manager', module_code: 'quality', access_level: 'full' },
    { role_code: 'quality_manager', module_code: 'production', access_level: 'read' },
    { role_code: 'quality_manager', module_code: 'inventory', access_level: 'read' },
    { role_code: 'quality_manager', module_code: 'incentive', access_level: 'read' },
    { role_code: 'staff', module_code: 'dashboard', access_level: 'read' },
    { role_code: 'staff', module_code: 'incentive', access_level: 'read' }
  ];
  const insertPerm = db.prepare('INSERT INTO role_permissions (role_code, module_code, access_level) VALUES (?,?,?)');
  permissions.forEach(p => insertPerm.run(p.role_code, p.module_code, p.access_level));
  console.log(`✅ 权限: ${permissions.length} 条`);

  // === 用户数据 ===
  const adminHash = bcrypt.hashSync('admin123', 10);
  const users = [
    { username: 'admin', password_hash: adminHash, real_name: '管理员', role: 'admin', role_code: 'super_admin', department: '总经办' },
    { username: 'boss', password_hash: bcrypt.hashSync('boss123', 10), real_name: '陈总', role: 'admin', role_code: 'owner', department: '总经办' },
    { username: 'zhangsan', password_hash: bcrypt.hashSync('123456', 10), real_name: '张三', role: 'manager', role_code: 'finance_manager', department: '财务部' },
    { username: 'lisi', password_hash: bcrypt.hashSync('123456', 10), real_name: '李四', role: 'staff', role_code: 'procurement_manager', department: '采购部' },
    { username: 'wangwu', password_hash: bcrypt.hashSync('123456', 10), real_name: '王五', role: 'staff', role_code: 'production_manager', department: '生产部' },
    { username: 'zhaoliu', password_hash: bcrypt.hashSync('123456', 10), real_name: '赵六', role: 'staff', role_code: 'warehouse_manager', department: '仓储部' },
    { username: 'sunqi', password_hash: bcrypt.hashSync('123456', 10), real_name: '孙七', role: 'staff', role_code: 'quality_manager', department: '质量部' },
    { username: 'zhouba', password_hash: bcrypt.hashSync('123456', 10), real_name: '周八', role: 'staff', role_code: 'staff', department: '行政部' }
  ];

  if (isSaaS) {
    const insertUser = db.prepare('INSERT INTO users (username, password_hash, real_name, role, role_code, department, tenant_id) VALUES (?,?,?,?,?,?,?)');
    users.forEach(u => insertUser.run(u.username, u.password_hash, u.real_name, u.role, u.role_code, u.department, 1));
  } else {
    const insertUser = db.prepare('INSERT INTO users (username, password_hash, real_name, role, role_code, department) VALUES (?,?,?,?,?,?)');
    users.forEach(u => insertUser.run(u.username, u.password_hash, u.real_name, u.role, u.role_code, u.department));
  }
  console.log(`✅ 用户: ${users.length} 条`);

  // === 物料数据 ===
  const materials = [
    { material_code: 'M001', material_name: '钢板Q235', category: '原材料', unit: '吨', unit_cost: 4200, annual_usage_amount: 120, abc_class: 'A', obsolete_days: 5 },
    { material_code: 'M002', material_name: '铜线φ2mm', category: '原材料', unit: 'kg', unit_cost: 68, annual_usage_amount: 5000, abc_class: 'A', obsolete_days: 3 },
    { material_code: 'M003', material_name: '螺丝M8×20', category: '标准件', unit: '个', unit_cost: 0.15, annual_usage_amount: 50000, abc_class: 'B', obsolete_days: 15 },
    { material_code: 'M004', material_name: '轴承6204', category: '标准件', unit: '个', unit_cost: 12.5, annual_usage_amount: 800, abc_class: 'B', obsolete_days: 8 },
    { material_code: 'M005', material_name: '电机Y2-90L', category: '外购件', unit: '台', unit_cost: 1850, annual_usage_amount: 200, abc_class: 'A', obsolete_days: 30 },
    { material_code: 'M006', material_name: '密封圈O型', category: '辅材', unit: '个', unit_cost: 2.8, annual_usage_amount: 3000, abc_class: 'C', obsolete_days: 120 },
    { material_code: 'M007', material_name: '油漆RAL7035', category: '化工', unit: 'kg', unit_cost: 35, annual_usage_amount: 600, abc_class: 'C', obsolete_days: 95 },
    { material_code: 'M008', material_name: '焊丝ER50-6', category: '耗材', unit: 'kg', unit_cost: 12, annual_usage_amount: 1500, abc_class: 'B', obsolete_days: 7 },
    { material_code: 'M009', material_name: '气弹簧', category: '外购件', unit: '个', unit_cost: 85, annual_usage_amount: 100, abc_class: 'B', obsolete_days: 150 },
    { material_code: 'M010', material_name: 'PLC模块', category: '电子件', unit: '块', unit_cost: 2800, annual_usage_amount: 50, abc_class: 'A', obsolete_days: 10 }
  ];
  if (isSaaS) {
    const insertMat = db.prepare('INSERT INTO materials (material_code, material_name, category, unit, unit_cost, annual_usage_amount, abc_class, obsolete_days, tenant_id) VALUES (?,?,?,?,?,?,?,?,?)');
    materials.forEach(m => insertMat.run(m.material_code, m.material_name, m.category, m.unit, m.unit_cost, m.annual_usage_amount, m.abc_class, m.obsolete_days, 1));
  } else {
    const insertMat = db.prepare('INSERT INTO materials (material_code, material_name, category, unit, unit_cost, annual_usage_amount, abc_class, obsolete_days) VALUES (?,?,?,?,?,?,?,?)');
    materials.forEach(m => insertMat.run(m.material_code, m.material_name, m.category, m.unit, m.unit_cost, m.annual_usage_amount, m.abc_class, m.obsolete_days));
  }
  console.log(`✅ 物料: ${materials.length} 条`);

  // === 产品 ===
  const products = [
    { product_code: 'P001', product_name: '精密减速机A型', category: '传动设备', unit: '台', standard_cost: 1250, target_cost: 1100, target_price: 1680, target_margin: 34.5 },
    { product_code: 'P002', product_name: '液压动力单元HPU-10', category: '液压设备', unit: '套', standard_cost: 3800, target_cost: 3400, target_price: 5200, target_margin: 34.6 },
    { product_code: 'P003', product_name: '自动化输送带BLD-200', category: '物流设备', unit: '米', standard_cost: 480, target_cost: 420, target_price: 680, target_margin: 38.2 },
    { product_code: 'P004', product_name: '智能控制柜CC-100', category: '电控设备', unit: '台', standard_cost: 5200, target_cost: 4500, target_price: 7500, target_margin: 40.0 }
  ];
  if (isSaaS) {
    const insertProd = db.prepare('INSERT INTO products (product_code, product_name, category, unit, standard_cost, target_cost, target_price, target_margin, tenant_id) VALUES (?,?,?,?,?,?,?,?,?)');
    products.forEach(p => insertProd.run(p.product_code, p.product_name, p.category, p.unit, p.standard_cost, p.target_cost, p.target_price, p.target_margin, 1));
  } else {
    const insertProd = db.prepare('INSERT INTO products (product_code, product_name, category, unit, standard_cost, target_cost, target_price, target_margin) VALUES (?,?,?,?,?,?,?,?)');
    products.forEach(p => insertProd.run(p.product_code, p.product_name, p.category, p.unit, p.standard_cost, p.target_cost, p.target_price, p.target_margin));
  }
  console.log(`✅ 产品: ${products.length} 个`);

  // === BOM ===
  const bomItems = [
    { product_id: 1, material_id: 1, material_name: '钢板Q235', quantity: 25, unit: 'kg', standard_price: 4.2 },
    { product_id: 1, material_id: 4, material_name: '轴承6204', quantity: 4, unit: '个', standard_price: 12.5 },
    { product_id: 2, material_id: 5, material_name: '电机Y2-90L', quantity: 1, unit: '台', standard_price: 1850 },
    { product_id: 3, material_id: 3, material_name: '螺丝M8×20', quantity: 40, unit: '个', standard_price: 0.15 },
    { product_id: 4, material_id: 10, material_name: 'PLC模块', quantity: 1, unit: '块', standard_price: 2800 }
  ];
  if (isSaaS) {
    const insertBom = db.prepare('INSERT INTO bom_items (product_id, material_id, material_name, quantity, unit, standard_price, tenant_id) VALUES (?,?,?,?,?,?,?)');
    bomItems.forEach(b => insertBom.run(b.product_id, b.material_id, b.material_name, b.quantity, b.unit, b.standard_price, 1));
  } else {
    const insertBom = db.prepare('INSERT INTO bom_items (product_id, material_id, material_name, quantity, unit, standard_price) VALUES (?,?,?,?,?,?)');
    bomItems.forEach(b => insertBom.run(b.product_id, b.material_id, b.material_name, b.quantity, b.unit, b.standard_price));
  }
  console.log(`✅ BOM: ${bomItems.length} 行`);

  // === 订单 ===
  for (let i = 1; i <= 12; i++) {
    const pid = (i % 4) + 1;
    const qty = Math.floor(Math.random() * 50 + 5);
    const uc = products[pid - 1].standard_cost * (0.85 + Math.random() * 0.3);
    const d = new Date(2026, Math.floor(i / 4), (i % 28) + 1);
    if (isSaaS) {
      db.prepare(`INSERT INTO orders (order_no, product_id, quantity, unit_price, order_date, status, material_cost_total, total_cost, unit_cost, tenant_id) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .run(`ORD${String(i).padStart(5,'0')}`, pid, qty, +(uc*1.35).toFixed(2), d.toISOString().slice(0,10), 'completed', +(uc*0.55).toFixed(2), +uc.toFixed(2), +uc.toFixed(2), 1);
    } else {
      db.prepare(`INSERT INTO orders (order_no, product_id, quantity, unit_price, order_date, status, material_cost_total, total_cost, unit_cost) VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(`ORD${String(i).padStart(5,'0')}`, pid, qty, +(uc*1.35).toFixed(2), d.toISOString().slice(0,10), 'completed', +(uc*0.55).toFixed(2), +uc.toFixed(2), +uc.toFixed(2));
    }
  }
  console.log(`✅ 订单: 12 条`);

  // === 供应商 ===
  const suppliers = [
    { supplier_name: '鑫源材料有限公司', contact_person: '陈经理', phone: '13800138001', level: 'A' },
    { supplier_name: '恒达钢铁集团', contact_person: '刘总', phone: '13900139002', level: 'A' },
    { supplier_name: '华铜实业有限公司', contact_person: '王经理', phone: '13700137003', level: 'B' }
  ];
  if (isSaaS) {
    const insertSup = db.prepare('INSERT INTO suppliers (supplier_code, supplier_name, contact_person, phone, level, status, tenant_id) VALUES (?,?,?,?,?,?,?)');
    suppliers.forEach((s, i) => insertSup.run(`SUP${String(i+1).padStart(3,'0')}`, s.supplier_name, s.contact_person, s.phone, s.level, 1, 1));
  } else {
    const insertSup = db.prepare('INSERT INTO suppliers (supplier_code, supplier_name, contact_person, phone, level, status) VALUES (?,?,?,?,?,?)');
    suppliers.forEach((s, i) => insertSup.run(`SUP${String(i+1).padStart(3,'0')}`, s.supplier_name, s.contact_person, s.phone, s.level, 1));
  }
  console.log(`✅ 供应商: ${suppliers.length} 家`);

  // === 采购单 ===
  if (isSaaS) {
    db.prepare(`INSERT INTO purchase_orders (po_no, supplier_id, material_id, material_name, quantity, unit_price, order_date, status, tenant_id) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run('PO001', 1, 1, '钢板Q235', 10, 4.2, '2026-06-01', 'completed', 1);
  } else {
    db.prepare(`INSERT INTO purchase_orders (po_no, supplier_id, material_id, material_name, quantity, unit_price, order_date, status) VALUES (?,?,?,?,?,?,?,?)`)
      .run('PO001', 1, 1, '钢板Q235', 10, 4.2, '2026-06-01', 'completed');
  }
  console.log(`✅ 采购单: 1 条`);

  // === OEE ===
  for (let d = 1; d <= 7; d++) {
    ['早班', '中班'].forEach(shift => {
      const dateStr = `2026-06-${String(d).padStart(2,'0')}`;
      if (isSaaS) {
        db.prepare(`INSERT INTO oee_records (record_date, equipment_name, shift, planned_time, output_qty, oee, tenant_id) VALUES (?,?,?,?,?,?,?)`)
          .run(dateStr, '数控加工中心', shift, 480, Math.floor(180+Math.random()*60), +(80+Math.random()*15).toFixed(1), 1);
      } else {
        db.prepare(`INSERT INTO oee_records (record_date, equipment_name, shift, planned_time, output_qty, oee) VALUES (?,?,?,?,?,?)`)
          .run(dateStr, '数控加工中心', shift, 480, Math.floor(180+Math.random()*60), +(80+Math.random()*15).toFixed(1));
      }
    });
  }
  console.log(`✅ OEE记录: 14 条`);

  // === 质量成本 ===
  ['prevention', 'appraisal', 'internal_failure'].forEach(t => {
    if (isSaaS) {
      db.prepare("INSERT INTO quality_costs (record_date, type, amount, tenant_id) VALUES (?,?,?,?)")
        .run('2026-06-01', t, Math.floor(5000+Math.random()*10000), 1);
    } else {
      db.prepare("INSERT INTO quality_costs (record_date, type, amount) VALUES (?,?,?)")
        .run('2026-06-01', t, Math.floor(5000+Math.random()*10000));
    }
  });
  console.log(`✅ 质量成本: 3 条`);

  // === 库存记录 ===
  if (isSaaS) {
    db.prepare(`INSERT INTO inventory_records (material_id, type, quantity, unit_cost, operator_id, tenant_id) VALUES (?,?,?,?,?,?)`)
      .run(1, 'in', 100, 4200, 1, 1);
  } else {
    db.prepare(`INSERT INTO inventory_records (material_id, type, quantity, unit_cost, operator_id) VALUES (?,?,?,?,?)`)
      .run(1, 'in', 100, 4200, 1);
  }
  console.log(`✅ 库存记录: 1 条`);

  // === 改善提案 ===
  const props = [
    { title: '优化下料排版降低浪费', status: 'completed', saving: 72000 },
    { title: '焊接参数优化提升良率', status: 'implementing', saving: 31000 }
  ];
  if (isSaaS) {
    const insertProp = db.prepare(`INSERT INTO improvement_proposals (title, proposer_id, department, status, expected_saving, actual_saving, tenant_id) VALUES (?,?,?,?,?,?,?)`);
    props.forEach(p => insertProp.run(p.title, 1, '生产部', p.status, p.saving, p.saving*0.85, 1));
  } else {
    const insertProp = db.prepare(`INSERT INTO improvement_proposals (title, proposer_id, department, status, expected_saving, actual_saving) VALUES (?,?,?,?,?,?)`);
    props.forEach(p => insertProp.run(p.title, 1, '生产部', p.status, p.saving, p.saving*0.85));
  }
  console.log(`✅ 提案: ${props.length} 条`);

  // === 激励规则 ===
  db.prepare('INSERT INTO incentive_rules (rule_name, saving_from, saving_to, share_ratio) VALUES (?,?,?,?)').run('成本节约分享-初级', 0, 50000, 0.3);
  console.log(`✅ 激励规则: 1 条`);

  // ====== SaaS 模式专属种子数据 ======
  if (isSaaS) {
    // 套餐
    const plans = [
      { plan_code: 'free', plan_name: '免费试用版', price_monthly: 0, price_yearly: 0, max_users: 3, data_retention_days: 30,
        features: JSON.stringify({ cost: true, procurement: false, inventory: false, production: false, quality: false, incentive: false, api: false }), sort_order: 1 },
      { plan_code: 'pro', plan_name: '专业版', price_monthly: 299, price_yearly: 2990, max_users: 20, data_retention_days: -1,
        features: JSON.stringify({ cost: true, procurement: true, inventory: true, production: false, quality: true, incentive: true, api: false }), sort_order: 2 },
      { plan_code: 'enterprise', plan_name: '企业版', price_monthly: 999, price_yearly: 9990, max_users: -1, data_retention_days: -1,
        features: JSON.stringify({ cost: true, procurement: true, inventory: true, production: true, quality: true, incentive: true, api: true }), sort_order: 3 }
    ];
    const insertPlan = db.prepare('INSERT INTO plans (plan_code, plan_name, price_monthly, price_yearly, max_users, data_retention_days, features, sort_order) VALUES (?,?,?,?,?,?,?,?)');
    plans.forEach(p => insertPlan.run(p.plan_code, p.plan_name, p.price_monthly, p.price_yearly, p.max_users, p.data_retention_days, p.features, p.sort_order));
    console.log(`✅ 套餐: ${plans.length} 个`);

    // 默认租户
    db.prepare(`INSERT INTO tenants (tenant_code, company_name, short_name, plan_id, status, max_users) VALUES (?,?,?,?,?,?)`)
      .run('tenant_0001', '示例制造有限公司', '示例制造', 2, 'active', -1);
    console.log('✅ 默认租户: 示例制造有限公司');

    // 平台管理员
    db.prepare("INSERT INTO platform_users (username, password_hash, real_name, role) VALUES (?,?,?,?)")
      .run('admin', bcrypt.hashSync('admin123', 10), '平台管理员', 'super_admin');
    console.log('✅ 平台管理员: admin / admin123');

    console.log('\n🎉 [SaaS模式] 种子数据初始化完成！');
    console.log('   租户用户: admin / admin123 (默认租户)');
    console.log('   总后台: POST /platform/auth/login {username:"admin", password:"admin123"}');
  } else {
    console.log('\n🎉 [Standalone模式] 种子数据初始化完成！');
    console.log('   超级管理员: admin / admin123');
    console.log('   企业老板:   boss / boss123');
  }
}

seed();
