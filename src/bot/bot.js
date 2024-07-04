const { readFile } = require('node:fs/promises');
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

    constructor(path) {
        this.path = path;
        this.refresh();
        this.status = false;
        this.bot = new Worker("./src/bot/mineflayer.js");
    }

    async refresh() {
        this.options = {
            host: "localhost", // will change to hypixel
            auth: "microsoft",
            version: "1.8.9",
            username: this.path,
            profilesFolder: "./profiles",
            port: 62203 // remove when not testing on localhost
        }
    }

    start() {
        return new Promise((resolve, reject) => {
            this.bot.on("message", (data) => {
                if (data.type != BotCommands.Started) return;
                resolve();
            });
            this.status = true;
            this.bot.postMessage({ type: BotCommands.Start, options: this.options });
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
}