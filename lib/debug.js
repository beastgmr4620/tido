const fs = require('fs');
const path = require('path');

module.exports = function writeLog(content) {
    fs.writeFileSync(path.join(context, '.log'), content, 'utf-8');
};
