const { parentPort } = require('worker_threads');
const { BotCommands } = require('../enums');
const mineflayer = require('mineflayer');
const prompts = require('@clack/prompts');

let bot;
let options;
let chatlog = [];

console.info = (info) => {
    if (info == "[msa] Signed in with Microsoft") return;
}

async function initBot(first) {
    bot = mineflayer.createBot(options);
    if (first) bot.once("login", () => {
        spinner.stop();
        setTimeout(() => parentPort.postMessage({ type: BotCommands.Started }), 100); // slight delay because apparently the spinner doesn't instantly stop or smth stupid
    });
    bot.on("messagestr", (message, username) => {
        if (username !== "chat") return;
        chatlog.unshift(message);
        if (chatlog.length > 100) chatlog.pop();
    });
    bot.on("end", (reason) => {
        if (reason == "Player Quit") return;
        initBot(false);
    });
    bot.on("error", () => {
        bot.quit();
    });
}

let spinner = prompts.spinner();

parentPort.on('message', (msg) => {
    switch (msg.type) {
        case BotCommands.Start:
            options = msg.options;  
            options.onMsaCode = (data) => {
                spinner.stop();
                prompts.log.message(`Sign in at http://microsoft.com/link?otc=${data.user_code}`);
                spinner.start();
            }
            spinner.start();
            initBot(true);
            break;
        case BotCommands.Stop:
            bot.quit("Player Quit");
            break;
        case BotCommands.ViewConsole:
            parentPort.postMessage({ type: BotCommands.ReturnConsole, logs: chatlog });
            break;
    }
});