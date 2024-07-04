const { parentPort } = require('worker_threads');
const { BotCommands } = require('../enums');
const mineflayer = require('mineflayer');
const prompts = require('@clack/prompts');

let bot;
let options;
let chatlog = [];
let config;
let chatqueue = [];
let ticks = 0;
let events;

console.info = (info) => {
    if (info == "[msa] Signed in with Microsoft") return;
}

function sleep(wait) {
    return new Promise((resolve) => setTimeout(() => resolve(), wait));
}

function inLobby() {
    if (bot.scoreboard[1] === undefined) return undefined; // In limbo
    if (bot.scoreboard[1].name === "Housing") return true; // In the housing lobby
    else if (bot.scoreboard[1].name === "housing") return false; // In a house
    else return undefined; // In a different lobby or smth else
}

function reloadEvents(first) {
    if (!bot) return;

    if (!first) bot.removeAllListeners();

    if (first) bot.once("login", () => {
        spinner.stop();
        setTimeout(() => parentPort.postMessage({ type: BotCommands.Started }), 100); // slight delay because apparently the spinner doesn't instantly stop or smth stupid
    });

    // events/functions specified by player
    for (let i = 0; i < events.length; i++) {
        let event = events[i];

        // custom events (like house_spawn)
        if (event.type == "house_spawn") {
            bot.on("spawn", async () => {
                await sleep(1000);
                if (inLobby() === false) executeActions(event.actions);
            });
        }

        // default event handling
    }


    // required events to function

    bot.on("spawn", async () => {
        await sleep(1000);
        if (inLobby() === undefined) return chatqueue.push("/hub housing");
        if (inLobby() === true) {
            // check config
            if (config.house?.autojoin) {
                return chatqueue.push(`/visit ${config.house.owner}`);
            }
        }
    });
    bot.on("windowOpen", (window) => {
        if (!inLobby()) return;
        if (!config.house?.autojoin) return;
        window.slots = window.slots.filter(n => n); // filter out blank slots
        bot.simpleClick.leftMouse(window.slots[config.house.house_slot - 1].slot);
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
    bot.on("error", (err) => {
        console.log(err);
        bot.quit();
    });

    // bot chat queue
    bot.on("physicsTick", () => {
        if (chatqueue.length == 0) return;
        ticks--;
        if (ticks <= 0) {
            bot.chat(chatqueue.shift());
            if (chatqueue.length > 0) ticks = 30;
        }
    });
}

async function initBot(first) {
    bot = mineflayer.createBot(options);
    reloadEvents(first);
}

function executeActions(actions) {
    for (let i = 0; i < actions.length; i++) {
        let action = actions[i];

        if (action.type == "chat") {
            chatqueue.push(action.message);
        }
    }
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
            config = msg.config;
            events = msg.events;
            spinner.start();
            initBot(true);
            break;
        case BotCommands.Stop:
            bot.quit("Player Quit");
            break;
        case BotCommands.ViewConsole:
            parentPort.postMessage({ type: BotCommands.ReturnConsole, logs: chatlog });
            break;
        case BotCommands.Refresh:
            config = msg.config;
            events = msg.events;

            if (bot) chatqueue.push("/hub housing"); // to be replaced by bot chat queue

            // update events function here
            reloadEvents(false);

            parentPort.postMessage({ type: BotCommands.RefreshDone });
            break;
        default:
            break;
    }
});