#!/usr/bin/env node

global.context = __dirname;

const yargs = require('yargs');
const path = require('path');
const fs = require('fs');

if (!fs.existsSync(path.join(__dirname, 'config.json')))
    fs.copyFileSync(path.join(__dirname, 'config.default.json'), path.join(__dirname, 'config.json'));

if (!fs.existsSync(path.join(__dirname, 'save'))) fs.mkdirSync(path.join(__dirname, 'save'));

global.getConfig = () => require(path.join(context, 'config.json'));
global.setConfig = (obj) => fs.writeFileSync(path.join(context, 'config.json'), JSON.stringify(obj, null, 2), 'utf-8');

const config = getConfig();
if (config.saveDir === '') {
    config.saveDir = path.join(__dirname, 'save');
    setConfig(config);
}

const commands = {
    save: require(path.join(context, 'lib', 'save.command')),
    download: require(path.join(context, 'lib', 'download.command')),
    where: require(path.join(__dirname, 'lib', 'where.command')),
};

yargs
    .scriptName('tido')
    .usage('$0 [command] [options/arguments]')
    .command(
        ['save <dir>', 's'],
        'Point out where to save videos',
        (ys) => {
            ys.positional('dir', {
                describe: 'Directory to save downloaded videos',
                type: 'string',
            });
        },
        commands.save
    )
    .command(
        ['download <url>', 'd'],
        'Download video',
        (ys) => {
            ys.positional('url', {
                describe: 'Video url (get from copy link button)',
                type: 'string',
            });
        },
        commands.download
    )
    .command(['where', 'w'], 'Print save directory', {}, commands.where)
    .option('verbose', {
        alias: ['v'],
        description: 'Show verbose logging',
    })
    .strict()
    .parse(process.argv.slice(2));
