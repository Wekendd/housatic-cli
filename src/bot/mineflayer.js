const { parentPort } = require('worker_threads');
const { BotCommands } = require('../enums');
const mineflayer = require('mineflayer');

let bot;

parentPort.on('message', (msg) => {
    switch (msg.type) {
        case BotCommands.Start:
            bot = mineflayer.createBot(msg.options);
            break;
        case BotCommands.Stop:
            bot.quit();
            break;
    }
});