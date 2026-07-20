function success(data, message = 'success') {
  return { code: 200, message, data: data !== undefined ? data : null };
}

function error(code, message, data = null) {
  return { code, message, data };
}

function paginate(query, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const list = query.slice(offset, offset + Number(pageSize));
  return {
    list,
    total: query.length,
    page: Number(page),
    pageSize: Number(pageSize)
  };
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toFixed(decimals);
}

module.exports = { success, error, paginate, formatDate, formatNumber };
