const { readFile } = require('node:fs/promises');
const { Worker } = require('worker_threads');
const { BotCommands } = require('../enums');

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
        this.options = JSON.parse(await readFile(`./bots/${this.path}/credentials.json`, "utf8"));
        this.options.host = "localhost" // change to hypixel later
        // this.options.auth = "microsoft"
        this.options.port = 53837 // just the port that opening to LAN gave me
    }

    async start() {
        this.status = true;
        this.bot.postMessage({ type: BotCommands.Start, options: this.options });
    }

    async stop() {
        this.status = false;
        this.bot.postMessage({ type: BotCommands.Stop });
    }
}