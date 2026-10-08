module.exports = function formatOrderNumber(value) {
  const sourceId = typeof value === 'string'
    ? value
    : value?.swap_request_id || value?.id || '';
  return String(sourceId).replace(/-/g, '').slice(0, 8).toUpperCase();
};

