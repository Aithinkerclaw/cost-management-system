const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');

/**
 * 获取KPI指标库列表
 * GET /api/cost-kpi/library
 */
router.get('/library', (req, res) => {
  const db = getDb();
  const { kpi_category, is_enabled } = req.query;
  
  let sql = 'SELECT * FROM cost_kpi_library WHERE 1=1';
  const params = [];
  
  if (kpi_category) {
    sql += ' AND kpi_category = ?';
    params.push(kpi_category);
  }
  if (is_enabled !== undefined) {
    sql += ' AND is_enabled = ?';
    params.push(is_enabled);
  }
  
  sql += ' ORDER BY kpi_category, kpi_code';
  
  db.all(sql, params, (err, kpis) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(kpis);
  });
});

/**
 * 获取单个KPI指标详情
 * GET /api/cost-kpi/library/:id
 */
router.get('/library/:id', (req, res) => {
  const db = getDb();
  const kpiId = req.params.id;
  
  db.get('SELECT * FROM cost_kpi_library WHERE id = ?', [kpiId], (err, kpi) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }
    res.json(kpi);
  });
});

/**
 * 创建KPI指标
 * POST /api/cost-kpi/library
 */
router.post('/library', (req, res) => {
  const db = getDb();
  const {
    kpi_code, kpi_name, kpi_category, description, calculation_formula,
    unit, target_value, warning_threshold, excellent_threshold, data_source, frequency
  } = req.body;
  
  if (!kpi_code || !kpi_name || !kpi_category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.run(`
    INSERT INTO cost_kpi_library (
      kpi_code, kpi_name, kpi_category, description, calculation_formula,
      unit, target_value, warning_threshold, excellent_threshold, data_source, frequency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    kpi_code, kpi_name, kpi_category, description, calculation_formula,
    unit, target_value, warning_threshold, excellent_threshold, data_source, frequency
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'KPI created successfully' });
  });
});

/**
 * 更新KPI指标
 * PUT /api/cost-kpi/library/:id
 */
router.put('/library/:id', (req, res) => {
  const db = getDb();
  const kpiId = req.params.id;
  const {
    kpi_name, kpi_category, description, calculation_formula,
    unit, target_value, warning_threshold, excellent_threshold, data_source, frequency, is_enabled
  } = req.body;
  
  db.run(`
    UPDATE cost_kpi_library SET
      kpi_name = ?,
      kpi_category = ?,
      description = ?,
      calculation_formula = ?,
      unit = ?,
      target_value = ?,
      warning_threshold = ?,
      excellent_threshold = ?,
      data_source = ?,
      frequency = ?,
      is_enabled = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    kpi_name, kpi_category, description, calculation_formula,
    unit, target_value, warning_threshold, excellent_threshold, data_source, frequency, is_enabled, kpiId
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'KPI not found' });
    }
    
    res.json({ message: 'KPI updated successfully' });
  });
});

/**
 * 获取成本绩效评价列表
 * GET /api/cost-kpi/evaluations
 */
router.get('/evaluations', (req, res) => {
  const db = getDb();
  const { evaluation_period, status } = req.query;
  
  let sql = `
    SELECT cke.*, 
           u.username as evaluator_name
    FROM cost_kpi_evaluations cke
    LEFT JOIN users u ON cke.evaluator_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (evaluation_period) {
    sql += ' AND cke.evaluation_period = ?';
    params.push(evaluation_period);
  }
  if (status) {
    sql += ' AND cke.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY cke.evaluation_period DESC, cke.created_at DESC';
  
  db.all(sql, params, (err, evaluations) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(evaluations);
  });
});

/**
 * 获取单个评价详情
 * GET /api/cost-kpi/evaluations/:id
 */
router.get('/evaluations/:id', (req, res) => {
  const db = getDb();
  const evaluationId = req.params.id;
  
  // 获取评价基本信息
  db.get(`
    SELECT cke.*, 
           u.username as evaluator_name
    FROM cost_kpi_evaluations cke
    LEFT JOIN users u ON cke.evaluator_id = u.id
    WHERE cke.id = ?
  `, [evaluationId], (err, evaluation) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    
    // 获取KPI评分明细
    db.all(`
      SELECT cks.* 
      FROM cost_kpi_scores cks
      WHERE cks.evaluation_id = ?
      ORDER BY cks.id
    `, [evaluationId], (err, scores) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        ...evaluation,
        scores: scores || []
      });
    });
  });
});

/**
 * 创建成本绩效评价
 * POST /api/cost-kpi/evaluations
 */
router.post('/evaluations', (req, res) => {
  const db = getDb();
  const {
    evaluation_code,
    evaluation_name,
    evaluation_period,
    project_id,
    department_id,
    comments
  } = req.body;
  
  if (!evaluation_code || !evaluation_name || !evaluation_period) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // 获取当前用户ID（简化用1）
  const evaluator_id = 1;
  
  db.run(`
    INSERT INTO cost_kpi_evaluations (
      evaluation_code, evaluation_name, evaluation_period, project_id,
      department_id, evaluator_id, comments
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    evaluation_code, evaluation_name, evaluation_period, project_id,
    department_id, evaluator_id, comments
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // 自动添加系统预设KPI到评分明细
    db.all('SELECT * FROM cost_kpi_library WHERE is_system = 1 AND is_enabled = 1', [], (err, kpis) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 为每个系统预设KPI创建评分记录
      const stmt = db.prepare(`
        INSERT INTO cost_kpi_scores (evaluation_id, kpi_id, kpi_code, kpi_name, weight)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      kpis.forEach(kpi => {
        stmt.run(this.lastID, kpi.id, kpi.kpi_code, kpi.kpi_name, 100 / kpis.length);  // 平均分配权重
      });
      
      stmt.finalize();
      
      res.status(201).json({
        id: this.lastID,
        message: 'Cost KPI evaluation created successfully'
      });
    });
  });
});

/**
 * 更新KPI评分
 * PUT /api/cost-kpi/evaluations/:evaluationId/scores/:scoreId
 */
router.put('/evaluations/:evaluationId/scores/:scoreId', (req, res) => {
  const db = getDb();
  const { actual_value, score, trend, analysis } = req.body;
  const scoreId = req.params.scoreId;
  
  db.run(`
    UPDATE cost_kpi_scores SET
      actual_value = ?,
      score = ?,
      trend = ?,
      analysis = ?
    WHERE id = ?
  `, [actual_value, score, trend, analysis, scoreId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Score not found' });
    }
    
    res.json({ message: 'KPI score updated successfully' });
  });
});

/**
 * 计算评价总分
 * POST /api/cost-kpi/evaluations/:id/calculate
 */
router.post('/evaluations/:id/calculate', (req, res) => {
  const db = getDb();
  const evaluationId = req.params.id;
  
  // 计算总分
  db.get(`
    SELECT SUM(weighted_score) as total_score
    FROM cost_kpi_scores
    WHERE evaluation_id = ?
  `, [evaluationId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const totalScore = result.total_score || 0;
    let grade = 'D';
    if (totalScore >= 90) grade = 'A';
    else if (totalScore >= 75) grade = 'B';
    else if (totalScore >= 60) grade = 'C';
    
    // 更新评价总分和等级
    db.run(`
      UPDATE cost_kpi_evaluations SET
        total_score = ?,
        grade = ?,
        status = 'calculated',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [totalScore, grade, evaluationId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        message: 'Evaluation calculated successfully',
        total_score: totalScore,
        grade: grade
      });
    });
  });
});

module.exports = router;
