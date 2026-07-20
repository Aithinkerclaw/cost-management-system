function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message, err.stack || '');

  if (err.name === 'ValidationError') {
    return res.status(400).json({ code: 400, message: err.message, data: null });
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ code: 401, message: '认证失败', data: null });
  }
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({ code: 409, message: '数据冲突：记录已存在', data: null });
  }

  res.status(err.statusCode || 500).json({
    code: err.statusCode || 500,
    message: err.message || '服务器内部错误',
    data: process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  });
}

module.exports = errorHandler;
