const prompts = require('@clack/prompts');
const { readdir, readFile } = require('node:fs/promises');
const Bot = require('./bot/bot');

let botdirs;
let bots = [];
async function refreshBots() {
    prompts.log.message("Loading ...");
    prompts.spinner();
    botdirs = await readdir("./bots/");
    for (let i = 0; i < botdirs.length; i++) {
        let credentials = JSON.parse(await readFile(`./bots/${botdirs[i]}/credentials.json`, "utf-8"));

        if (credentials == undefined) {
            botdirs.splice(i, 1);
            i--;
            continue;
        }
        bots.push(new Bot(botdirs[i]));
    }
}

function getBotDirs() {return botdirs;}
function getBots() {return bots;}

module.exports = {
    getBotDirs,
    getBots,
    refreshBots
}