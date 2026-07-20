const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');

/**
 * 获取成本预算列表
 * GET /api/cost-budgets
 */
router.get('/', (req, res) => {
  const db = getDb();
  const { budget_type, status, fiscal_year, project_id } = req.query;
  
  let sql = `
    SELECT cb.*, 
           p.project_name,
           u.username as prepared_name
    FROM cost_budgets cb
    LEFT JOIN projects p ON cb.project_id = p.id
    LEFT JOIN users u ON cb.prepared_by = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (budget_type) {
    sql += ' AND cb.budget_type = ?';
    params.push(budget_type);
  }
  if (status) {
    sql += ' AND cb.status = ?';
    params.push(status);
  }
  if (fiscal_year) {
    sql += ' AND cb.fiscal_year = ?';
    params.push(fiscal_year);
  }
  if (project_id) {
    sql += ' AND cb.project_id = ?';
    params.push(project_id);
  }
  
  sql += ' ORDER BY cb.created_at DESC';
  
  db.all(sql, params, (err, budgets) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(budgets);
  });
});

/**
 * 获取单个成本预算详情
 * GET /api/cost-budgets/:id
 */
router.get('/:id', (req, res) => {
  const db = getDb();
  const budgetId = req.params.id;
  
  // 获取预算基本信息
  db.get(`
    SELECT cb.*, 
           p.project_name,
           u.username as prepared_name
    FROM cost_budgets cb
    LEFT JOIN projects p ON cb.project_id = p.id
    LEFT JOIN users u ON cb.prepared_by = u.id
    WHERE cb.id = ?
  `, [budgetId], (err, budget) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // 获取预算明细
    db.all('SELECT * FROM cost_budget_details WHERE budget_id = ? ORDER BY account_code', [budgetId], (err, details) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 获取审批记录
      db.all(`
        SELECT cba.*, u.username as approver_name
        FROM cost_budget_approvals cba
        LEFT JOIN users u ON cba.approver_id = u.id
        WHERE cba.budget_id = ?
        ORDER BY cba.approval_step
      `, [budgetId], (err, approvals) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // 获取执行监控数据
        db.all('SELECT * FROM cost_budget_executions WHERE budget_id = ? ORDER BY period', [budgetId], (err, executions) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.json({
            ...budget,
            details: details || [],
            approvals: approvals || [],
            executions: executions || []
          });
        });
      });
    });
  });
});

/**
 * 创建成本预算
 * POST /api/cost-budgets
 */
router.post('/', (req, res) => {
  const db = getDb();
  const {
    budget_code,
    budget_name,
    project_id,
    budget_type,
    fiscal_year,
    start_date,
    end_date,
    total_amount,
    wbs_structure,
    notes
  } = req.body;
  
  // 验证必填字段
  if (!budget_code || !budget_name || !start_date || !end_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // 获取当前用户ID（从token中解析，这里简化用1）
  const prepared_by = 1;
  
  db.run(`
    INSERT INTO cost_budgets (
      budget_code, budget_name, project_id, budget_type, fiscal_year,
      start_date, end_date, total_amount, prepared_by, wbs_structure, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    budget_code, budget_name, project_id, budget_type, fiscal_year,
    start_date, end_date, total_amount, prepared_by, wbs_structure, notes
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({
      id: this.lastID,
      message: 'Cost budget created successfully'
    });
  });
});

/**
 * 更新成本预算
 * PUT /api/cost-budgets/:id
 */
router.put('/:id', (req, res) => {
  const db = getDb();
  const budgetId = req.params.id;
  const {
    budget_name,
    project_id,
    budget_type,
    fiscal_year,
    start_date,
    end_date,
    total_amount,
    status,
    wbs_structure,
    notes
  } = req.body;
  
  db.run(`
    UPDATE cost_budgets SET
      budget_name = ?,
      project_id = ?,
      budget_type = ?,
      fiscal_year = ?,
      start_date = ?,
      end_date = ?,
      total_amount = ?,
      status = ?,
      wbs_structure = ?,
      notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    budget_name, project_id, budget_type, fiscal_year,
    start_date, end_date, total_amount, status,
    wbs_structure, notes, budgetId
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json({ message: 'Cost budget updated successfully' });
  });
});

/**
 * 删除成本预算
 * DELETE /api/cost-budgets/:id
 */
router.delete('/:id', (req, res) => {
  const db = getDb();
  const budgetId = req.params.id;
  
  // 检查状态，只有草稿可以删除
  db.get('SELECT status FROM cost_budgets WHERE id = ?', [budgetId], (err, budget) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    if (budget.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft budgets can be deleted' });
    }
    
    db.run('DELETE FROM cost_budgets WHERE id = ?', [budgetId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Cost budget deleted successfully' });
    });
  });
});

/**
 * 提交预算审批
 * POST /api/cost-budgets/:id/submit-approval
 */
router.post('/:id/submit-approval', (req, res) => {
  const db = getDb();
  const budgetId = req.params.id;
  
  // 更新预算状态为审批中
  db.run('UPDATE cost_budgets SET status = ? WHERE id = ?', ['reviewing', budgetId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // 创建审批记录（示例：部门经理审批）
    db.run(`
      INSERT INTO cost_budget_approvals (budget_id, approval_step, approver_id, approval_role, status)
      VALUES (?, 1, 2, 'dept_manager', 'pending')
    `, [budgetId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ message: 'Budget submitted for approval' });
    });
  });
});

/**
 * 审批预算
 * POST /api/cost-budgets/:id/approve
 */
router.post('/:id/approve', (req, res) => {
  const db = getDb();
  const budgetId = req.params.id;
  const { approval_step, comment } = req.body;
  
  // 更新审批记录
  db.run(`
    UPDATE cost_budget_approvals SET
      status = 'approved',
      comment = ?,
      approval_date = CURRENT_TIMESTAMP
    WHERE budget_id = ? AND approval_step = ?
  `, [comment, budgetId, approval_step], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // 检查是否所有审批步骤都已完成
    db.get(`
      SELECT COUNT(*) as pending_count
      FROM cost_budget_approvals
      WHERE budget_id = ? AND status = 'pending'
    `, [budgetId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (result.pending_count === 0) {
        // 所有审批都通过，更新预算状态为已批准
        db.run('UPDATE cost_budgets SET status = ? WHERE id = ?', ['approved', budgetId], function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Budget approved successfully' });
        });
      } else {
        res.json({ message: 'Approval step completed' });
      }
    });
  });
});

/**
 * 获取预算执行监控数据
 * GET /api/cost-budgets/:id/execution
 */
router.get('/:id/execution', (req, res) => {
  const db = getDb();
  const budgetId = req.params.id;
  const { period } = req.query;
  
  let sql = 'SELECT * FROM cost_budget_executions WHERE budget_id = ?';
  const params = [budgetId];
  
  if (period) {
    sql += ' AND period = ?';
    params.push(period);
  }
  
  sql += ' ORDER BY period';
  
  db.all(sql, params, (err, executions) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(executions);
  });
});

/**
 * 更新预算执行数据
 * POST /api/cost-budgets/:id/update-execution
 */
router.post('/:id/update-execution', (req, res) => {
  const db = getDb();
  const budgetId = req.params.id;
  const { period, account_code, actual_amount } = req.body;
  
  // 检查是否存在执行记录
  db.get(`
    SELECT id FROM cost_budget_executions
    WHERE budget_id = ? AND period = ? AND account_code = ?
  `, [budgetId, period, account_code], (err, record) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (record) {
      // 更新现有记录
      db.run(`
        UPDATE cost_budget_executions SET
          actual_amount = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [actual_amount, record.id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Execution data updated successfully' });
      });
    } else {
      // 创建新记录
      db.run(`
        INSERT INTO cost_budget_executions (budget_id, account_code, period, actual_amount)
        VALUES (?, ?, ?, ?)
      `, [budgetId, account_code, period, actual_amount], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Execution data created successfully' });
      });
    }
  });
});

module.exports = router;
