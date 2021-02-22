const path = require('path');
const fs = require('fs');
const platform = require('os').platform();

module.exports = function save(args) {
    const saveDir = path.resolve(args.dir);

    if (!fs.existsSync(saveDir)) return console.error('Cannot add save directory: path does not exist');
    if (!fs.statSync(saveDir).isDirectory()) return console.error('Cannot add save directory: path is not a directory');

    const config = getConfig();
    config.saveDir = saveDir;

    setConfig(config);
    console.log('Save directory added successfully');
};
