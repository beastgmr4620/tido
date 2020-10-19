const request = require('request');
const chalk = require('chalk');
const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

const config = getConfig();

function fetchPageSource(url) {
    return new Promise((resolve, reject) => {
        console.log(`[${chalk.blue(new Date().toLocaleTimeString('vi'))}] Fetching page source...`);

        request(
            {
                url,
                ...config.http,
            },
            (err, _res, body) => {
                if (err) return reject(err);

                return resolve(body);
            }
        );
    });
}

function parsePageSource(raw) {
    return new Promise((resolve, reject) => {
        console.log(`[${chalk.blue(new Date().toLocaleTimeString('vi'))}] Parsing page source...`);

        const $ = cheerio.load(raw);
        const detail = $('#__NEXT_DATA__');

        if (detail.length !== 1) return reject(new Error('Cannot find video detail'));

        const videoDetail = JSON.parse(detail.html());
        const videoURL = videoDetail.props.pageProps.videoData.itemInfos.video.urls[0];
        resolve({ name: `${+new Date()}`, url: videoURL });
    });
}

function downloadVideo({ name, url }) {
    return new Promise((resolve, reject) => {
        console.log(`[${chalk.blue(new Date().toLocaleTimeString('vi'))}] Downloading video...`);

        const buffer = [];
        const response = request(
            {
                url,
                ...config.http,
            },
            (err) => {
                if (err) return reject(err);
            }
        );

        response.on('data', (data) => buffer.push(data));
        response.on('error', (err) => reject(err));
        response.on('complete', () => resolve({ where: name, buffer: Buffer.concat(buffer) }));
    });
}

function saveVideo({ where, buffer }) {
    return new Promise((resolve, reject) => {
        console.log(`[${chalk.blue(new Date().toLocaleTimeString('vi'))}] Saving video...`);
        fs.writeFileSync(path.join(config.saveDir, `${where}.tido.mp4`), buffer);
        console.log(`[${chalk.blue(new Date().toLocaleTimeString('vi'))}] Video saved!`);
    });
}

module.exports = function download(args) {
    const url = args.url;

    Promise.resolve(url)
        .then(fetchPageSource)
        .then(parsePageSource)
        .then(downloadVideo)
        .then(saveVideo)
        .catch((error) => {
            console.error(error);
        });
};
