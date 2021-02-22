const request = require('request');
const chalk = require('chalk');
const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const hasTermux = require('has-termux-api');
const debug = require(path.join(__dirname, 'debug'));
const current = require(path.join(__dirname, 'current'));

const config = getConfig();
const cookie = {};

function getCookie() {
    return Object.keys(cookie)
        .map((key) => `${key}=${cookie[key]}`)
        .join('; ');
}

function syncCookie(rawCookie) {
    rawCookie &&
        rawCookie.forEach((raw) => {
            raw = raw.split(';')[0].split('=');
            cookie[raw[0]] = raw.slice(1).join('=');
        });
}

let last = +new Date();

function estimate() {
    const est = +new Date() - last;
    last += est;
    return chalk.yellow(`+${est}ms`);
}

function fetchPageSource(prefetch, url) {
    return new Promise((resolve, reject) => {
        console.log(`[${chalk.blue(current())}] ${prefetch ? 'Prefetching' : 'Fetching'} page source... ${estimate()}`);

        request(
            {
                url,
                headers: {
                    ...config.http.headers,
                    Cookie: getCookie(),
                },
                followRedirect: (response) => {
                    syncCookie(response.headers['set-cookie']);
                    response.request.setHeader('Cookie', getCookie());
                    return true;
                },
            },
            (err, response, body) => {
                if (err) return reject(err);

                syncCookie(response.headers['set-cookie']);

                if (prefetch) return resolve(url);

                return resolve(body);
            }
        );
    });
}

function parsePageSource(raw) {
    return new Promise((resolve, reject) => {
        console.log(`[${chalk.blue(current())}] Parsing page source... ${estimate()}`);

        const $ = cheerio.load(raw);
        const detail = $('#__NEXT_DATA__');

        if (detail.length !== 1) return reject(new Error('Cannot find video detail'));

        const videoDetail = JSON.parse(detail.html());
        debug(detail.html());
        const videoURL = videoDetail.props.pageProps.itemInfo.itemStruct.video.playAddr;
        resolve({ name: `${+new Date()}`, url: videoURL });
    });
}

function downloadVideo({ name, url }) {
    return new Promise((resolve, reject) => {
        console.log(`[${chalk.blue(current())}] Downloading video... ${estimate()}`);

        const buffer = [];
        request(
            {
                url,
                method: config.http.method,
                headers: {
                    ...config.http.headers,
                    cookie: getCookie(),
                },
            },
            (err) => {
                if (err) return reject(err);
            }
        )
            .on('data', (data) => buffer.push(data))
            .on('error', (err) => reject(err))
            .on('complete', () => resolve({ where: name, buffer: Buffer.concat(buffer) }));
    });
}

function saveVideo({ where, buffer }) {
    return new Promise((resolve, reject) => {
        console.log(`[${chalk.blue(current())}] Saving video... ${estimate()}`);
        try {
            fs.writeFileSync(path.join(config.saveDir, `${where}.tido.mp4`), buffer);
        } catch (e) {
            return reject(e);
        }
        console.log(`[${chalk.blue(current())}] Video saved! ${estimate()}`);
        resolve(path.join(config.saveDir, `${where}.tido.mp4`));
    });
}

function syncVideo(fileName) {
    return new Promise((resolve, reject) => {
        if (process.platform === 'android' && hasTermux.sync()) {
            console.log(`[${chalk.yellow(current())}] Android (Termux) detected ${estimate()}`);
            console.log(`[${chalk.blue(current())}] Synchronizing video with media scanner ${estimate()}`);

            const childProcess = require('child_process');
            const scanner = childProcess.spawn('termux-media-scan', [fileName]);
            const errors = [];

            scanner.stderr.on('data', (e) => {
                errors.push(e);
            });

            scanner.on('exit', () => {
                if (errors.length === 0) {
                    console.log(`[${chalk.blue(current())}] Synchronized successfully ${estimate()}`);

                    return resolve();
                }

                reject(errors);
            });
        } else {
            resolve();
        }
    });
}

module.exports = function download(args) {
    const url = args.url;

    Promise.resolve(url)
        .then(fetchPageSource.bind(null, true))
        .then(fetchPageSource.bind(null, false))
        .then(parsePageSource)
        .then(downloadVideo)
        .then(saveVideo)
        .then(syncVideo)
        .catch((error) => {
            console.error(error);
        });
};
