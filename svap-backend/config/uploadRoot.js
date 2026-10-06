const path = require('path');

module.exports = process.env.UPLOAD_DIR || (
  process.platform === 'win32'
    ? path.resolve(__dirname, '..', 'uploads')
    : '/svap/uploads'
);