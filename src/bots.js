const prompts = require('@clack/prompts');
const { readdir, readFile } = require('node:fs/promises');
const Bot = require('./bot/bot');
const platformPath = require('./path');

let botdirs;
let bots = [];

async function refreshBots() {
    prompts.log.message("Loading ...");
    let spinner = prompts.spinner();
    spinner.start();
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
            bots.push(new Bot(botdirs[i], config));
        } catch (e) {

        }
    }
    spinner.stop();
}

function getBotDirs() {return botdirs;}
function getBots() {return bots;}

module.exports = {
    getBotDirs,
    getBots,
    refreshBots
}