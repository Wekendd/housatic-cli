const { unlink, readdir, readFile } = require('node:fs/promises');
const { Worker } = require('worker_threads');
const _path = require('path');
const { BotCommands } = require('../enums');
const crypto = require('crypto');
const platformPath = require('../path');

function createHash(input) {
    return crypto.createHash('sha1').update(input ?? '', 'binary').digest('hex').substr(0, 6)
}

module.exports = class Bot {
    options;
    path;
    status;
    bot;
    config;
    events;

    constructor(path, config) {
        this.path = path;
        this.refresh();
        this.status = false;
        try {
        this.bot = new Worker(_path.join(__dirname, "./mineflayer.js"));
        } catch (e) {
            console.log(e);
        }
        this.config = config;
        this.options = {
            host: "hypixel.net", // will change to hypixel
            auth: "microsoft",
            version: "1.8.9",
            username: this.path,
            profilesFolder: `${platformPath}/profiles`,
            // port: 62203 // remove when not testing on localhost
        }
    }

    refresh() {
        return new Promise((resolve, reject) => {
            // this is disgusting never let me code again
            try {
                readFile(`${platformPath}/bots/${this.path}/bot.json`, "utf-8").then((configraw) => {
                    this.config = JSON.parse(configraw);
                    try {
                        readFile(`${platformPath}/bots/${this.path}/events.json`, "utf-8").then((eventsraw) => {
                            this.events = JSON.parse(eventsraw);
                            this.bot.postMessage({ type: BotCommands.Refresh, config: this.config, events: this.events, path: this.path });
                            this.bot.on("message", (data) => {
                                if (data.type != BotCommands.RefreshDone) return;
                                resolve();
                            });
                        });
                    } catch (e) {
                        this.events = null;
                    }
                });
            } catch (e) {
                reject();
                console.log(e);
            }
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.bot.on("message", (data) => {
                if (data.type != BotCommands.Started) return;
                resolve();
            });
            this.status = true;
            this.bot.postMessage({ type: BotCommands.Start, options: this.options, config: this.config, events: this.events, path: this.path });
        })
    }

    async stop() {
        this.status = false;
        this.bot.postMessage({ type: BotCommands.Stop });
    }

    getConsole() {
        return new Promise((resolve, reject) => {
            this.bot.on("message", (data) => {
                if (data.type != BotCommands.ReturnConsole) return;
                resolve(data.logs);
            });
            this.bot.postMessage({ type: BotCommands.ViewConsole });
        })
    }

    async logOut() {
        let hash = createHash(this.path);
        let caches = await readdir(`${platformPath}/profiles/`);
        if (caches.includes(`${hash}_live-cache.json`)) await unlink(`${platformPath}/profiles/${hash}_live-cache.json`);
        if (caches.includes(`${hash}_mca-cache.json`)) await unlink(`${platformPath}/profiles/${hash}_mca-cache.json`);
        if (caches.includes(`${hash}_xbl-cache.json`)) await unlink(`${platformPath}/profiles/${hash}_xbl-cache.json`);
    }
}