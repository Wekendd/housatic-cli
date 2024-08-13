const prompts = require('@clack/prompts');
const { readdir, readFile } = require('node:fs/promises');
const Bot = require('./bot/bot');
const platformPath = require('./path');

let botdirs;
let bots = [];

async function refreshBots() {
    botdirs = await readdir(`${platformPath}/bots/`);
    for (let i = 0; i < botdirs.length; i++) {
        try {
            let configraw = await readFile(`${platformPath}/bots/${botdirs[i]}/bot.json`, "utf-8");
            let config = JSON.parse(configraw);

            if (config == undefined) {
                botdirs.splice(i, 1);
                i--;
                continue;
            }
            if (!bots.some(n => n.path == botdirs[i])) bots.push(new Bot(botdirs[i], config));
        } catch (e) {

        }
    }
    if (botdirs.length > bots.length) {
        bots = bots.filter(n => botdirs.includes(n.path));
    }
}

function getBotDirs() {return botdirs;}
function getBots() {return bots;}

module.exports = {
    getBotDirs,
    getBots,
    refreshBots
}