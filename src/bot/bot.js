const { unlink, readdir, readFile } = require('node:fs/promises');
const { Worker } = require('worker_threads');
const { BotCommands } = require('../enums');
const crypto = require('crypto');

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
        this.bot = new Worker("./src/bot/mineflayer.js");
        this.config = config;
        this.options = {
            host: "hypixel.net", // will change to hypixel
            auth: "microsoft",
            version: "1.8.9",
            username: this.path,
            profilesFolder: "./profiles",
            // port: 62203 // remove when not testing on localhost
        }
    }

    refresh() {
        return new Promise((resolve, reject) => {
            // this is disgusting never let me code again
            try {
                readFile(`./bots/${this.path}/config.json`, "utf-8").then((configraw) => {
                    this.config = JSON.parse(configraw);
                    try {
                        readFile(`./bots/${this.path}/events.json`, "utf-8").then((eventsraw) => {
                            this.events = JSON.parse(eventsraw);
                            this.bot.postMessage({ type: BotCommands.Refresh, config: this.config, events: this.events });
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
            this.bot.postMessage({ type: BotCommands.Start, options: this.options, config: this.config, events: this.events });
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
        let caches = await readdir(`./profiles/`);
        if (caches.includes(`${hash}_live-cache.json`)) await unlink(`./profiles/${hash}_live-cache.json`);
        if (caches.includes(`${hash}_mca-cache.json`)) await unlink(`./profiles/${hash}_mca-cache.json`);
        if (caches.includes(`${hash}_xbl-cache.json`)) await unlink(`./profiles/${hash}_xbl-cache.json`);
    }
}