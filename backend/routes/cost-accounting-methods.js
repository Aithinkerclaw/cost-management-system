const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');

/**
 * 获取成本核算方法列表
 * GET /api/cost-accounting-methods
 */
router.get('/', (req, res) => {
  const db = getDb();
  const { is_enabled } = req.query;
  
  let sql = 'SELECT * FROM cost_accounting_methods WHERE 1=1';
  const params = [];
  
  if (is_enabled !== undefined) {
    sql += ' AND is_enabled = ?';
    params.push(is_enabled);
  }
  
  sql += ' ORDER BY is_default DESC, method_code';
  
  db.all(sql, params, (err, methods) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(methods);
  });
});

/**
 * 获取单个核算方法详情
 * GET /api/cost-accounting-methods/:code
 */
router.get('/:code', (req, res) => {
  const db = getDb();
  const methodCode = req.params.code;
  
  db.get('SELECT * FROM cost_accounting_methods WHERE method_code = ?', [methodCode], (err, method) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!method) {
      return res.status(404).json({ error: 'Method not found' });
    }
    
    // 获取使用该方法的核算对象
    db.all('SELECT * FROM cost_accounting_objects WHERE method_code = ? AND is_enabled = 1', [methodCode], (err, objects) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        ...method,
        objects: objects || []
      });
    });
  });
});

/**
 * 创建核算方法
 * POST /api/cost-accounting-methods
 */
router.post('/', (req, res) => {
  const db = getDb();
  const { method_code, method_name, description, applicable_scenarios, is_enabled, is_default } = req.body;
  
  if (!method_code || !method_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.run(`
    INSERT INTO cost_accounting_methods (method_code, method_name, description, applicable_scenarios, is_enabled, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [method_code, method_name, description, applicable_scenarios, is_enabled, is_default], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Accounting method created successfully' });
  });
});

/**
 * 更新核算方法
 * PUT /api/cost-accounting-methods/:code
 */
router.put('/:code', (req, res) => {
  const db = getDb();
  const methodCode = req.params.code;
  const { method_name, description, applicable_scenarios, is_enabled, is_default } = req.body;
  
  db.run(`
    UPDATE cost_accounting_methods SET
      method_name = ?,
      description = ?,
      applicable_scenarios = ?,
      is_enabled = ?,
      is_default = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE method_code = ?
  `, [method_name, description, applicable_scenarios, is_enabled, is_default, methodCode], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Method not found' });
    }
    
    res.json({ message: 'Accounting method updated successfully' });
  });
});

/**
 * 获取核算对象列表
 * GET /api/cost-accounting-objects
 */
router.get('/objects/list', (req, res) => {
  const db = getDb();
  const { method_code, object_type, is_enabled } = req.query;
  
  let sql = 'SELECT * FROM cost_accounting_objects WHERE 1=1';
  const params = [];
  
  if (method_code) {
    sql += ' AND method_code = ?';
    params.push(method_code);
  }
  if (object_type) {
    sql += ' AND object_type = ?';
    params.push(object_type);
  }
  if (is_enabled !== undefined) {
    sql += ' AND is_enabled = ?';
    params.push(is_enabled);
  }
  
  sql += ' ORDER BY method_code, sort_order, object_code';
  
  db.all(sql, params, (err, objects) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(objects);
  });
});

/**
 * 创建核算对象
 * POST /api/cost-accounting-objects
 */
router.post('/objects', (req, res) => {
  const db = getDb();
  const { object_code, object_name, object_type, method_code, cost_account_code, parent_object_id, sort_order, notes } = req.body;
  
  if (!object_code || !object_name || !object_type || !method_code) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.run(`
    INSERT INTO cost_accounting_objects (object_code, object_name, object_type, method_code, cost_account_code, parent_object_id, sort_order, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [object_code, object_name, object_type, method_code, cost_account_code, parent_object_id, sort_order, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Accounting object created successfully' });
  });
});

/**
 * 获取成本分配列表
 * GET /api/cost-allocations
 */
router.get('/allocations/list', (req, res) => {
  const db = getDb();
  const { accounting_period, object_id, status } = req.query;
  
  let sql = `
    SELECT ca.*, 
           cao.object_name,
           cao.object_type,
           cam.method_name
    FROM cost_allocations ca
    LEFT JOIN cost_accounting_objects cao ON ca.object_id = cao.id
    LEFT JOIN cost_accounting_methods cam ON cao.method_code = cam.method_code
    WHERE 1=1
  `;
  const params = [];
  
  if (accounting_period) {
    sql += ' AND ca.accounting_period = ?';
    params.push(accounting_period);
  }
  if (object_id) {
    sql += ' AND ca.object_id = ?';
    params.push(object_id);
  }
  if (status) {
    sql += ' AND ca.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY ca.accounting_period DESC, ca.id DESC';
  
  db.all(sql, params, (err, allocations) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(allocations);
  });
});

/**
 * 创建成本分配记录
 * POST /api/cost-allocations
 */
router.post('/allocations', (req, res) => {
  const db = getDb();
  const {
    allocation_code,
    accounting_period,
    object_id,
    account_code,
    account_name,
    direct_material,
    direct_labor,
    manufacturing_overhead,
    allocated_overhead,
    allocation_base,
    allocation_rate,
    output_quantity,
    notes
  } = req.body;
  
  if (!allocation_code || !accounting_period || !object_id || !account_code) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // 获取当前用户ID（简化用1）
  const created_by = 1;
  
  db.run(`
    INSERT INTO cost_allocations (
      allocation_code, accounting_period, object_id, account_code, account_name,
      direct_material, direct_labor, manufacturing_overhead, allocated_overhead,
      allocation_base, allocation_rate, output_quantity, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    allocation_code, accounting_period, object_id, account_code, account_name,
    direct_material, direct_labor, manufacturing_overhead, allocated_overhead,
    allocation_base, allocation_rate, output_quantity, notes, created_by
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Cost allocation created successfully' });
  });
});

/**
 * 计算产品成本
 * POST /api/cost-accounting/calculate
 */
router.post('/calculate', (req, res) => {
  const db = getDb();
  const { accounting_period, object_id } = req.body;
  
  if (!accounting_period || !object_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // 这里是成本计算逻辑（简化版）
  // 实际应该根据核算方法（品种法/分批法/分步法）进行不同的计算
  
  db.get(`
    SELECT ca.*, cao.method_code, cam.method_name
    FROM cost_allocations ca
    LEFT JOIN cost_accounting_objects cao ON ca.object_id = cao.id
    LEFT JOIN cost_accounting_methods cam ON cao.method_code = cam.method_code
    WHERE ca.accounting_period = ? AND ca.object_id = ?
  `, [accounting_period, object_id], (err, allocation) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!allocation) {
      return res.status(404).json({ error: 'No allocation record found' });
    }
    
    // 更新状态为已计算
    db.run('UPDATE cost_allocations SET status = ? WHERE id = ?', ['calculated', allocation.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        message: 'Cost calculated successfully',
        allocation: allocation
      });
    });
  });
});

module.exports = router;
