const path = require('path');
const fs = require('fs');
const platform = require('os').platform();

function validateDir(dir) {
    if (platform !== 'win32') return Boolean(dir.match(/^(\/[^\/ ]*)+\/?$/));
    else return Boolean(dir.match(/^[a-zA-Z]:[\\\/](?:[a-zA-Z0-9]+[\\\/]?)*$/));
}

module.exports = function save(args) {
    const saveDir = args.dir;

    if (!validateDir(saveDir)) return console.error('Cannot add save directory: path must be absolute');
    if (!fs.existsSync(saveDir)) return console.error('Cannot add save directory: path does not exist');
    if (!fs.statSync(saveDir).isDirectory()) return console.error('Cannot add save directory: path is not a directory');

    const config = getConfig();
    config.saveDir = path.resolve(saveDir);

    setConfig(config);
    console.log('Save directory added successfully');
};
