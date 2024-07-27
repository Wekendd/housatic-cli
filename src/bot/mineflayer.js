const { parentPort } = require("worker_threads");
const { BotCommands } = require("../enums");
const mineflayer = require("mineflayer");
const prompts = require("@clack/prompts");
const { writeFile } = require("node:fs/promises");
const zlib = require("node:zlib");

let bot;
let options;
let chatlog = [];
let config;
let chatqueue = [];
let ticks = 0;
let events;
let path;

console.info = (info) => {
    if (info == "[msa] Signed in with Microsoft") return;
};

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

    if (first)
        bot.once("login", () => {
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
        // event for chat since we want criterias + mineflayer chat messages are a bit goofy
        else if (event.type == "chat") {
            let matcher;
            if (event.criteria.startsWith("/") && event.criteria.endsWith("/"))
                matcher = new RegExp(event.criteria.substring(1, event.criteria.length - 1));
            else {
                // using CT's formatting
                let modifiedCriteria = event.criteria.replace(
                    /([\\\(\)\[\]\{\}\?\*\+\^\$\-])/g,
                    "\\$1"
                ); // sanitize it so no stray tokens mess up the regex constructor
                modifiedCriteria = modifiedCriteria.replace(/\\\$\\\{([^*]+)\\\}/g, "(?<$1>.*)"); // named groups as ${name}
                modifiedCriteria = modifiedCriteria.replace(/\\\$\\\{[*]+\\\}/g, "(?:$1)"); // unnamed groups becoming noncaptures such as ${*}
                matcher = new RegExp("^" + modifiedCriteria);
            }
            bot.on("messagestr", (message, username) => {
                if (username !== "chat") return;
                // if (inLobby() !== false) return;
                let match = message.match(matcher);
                if (match) {
                    executeActions(event.actions, match.groups);
                }
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
        window.slots = window.slots.filter((n) => n); // filter out blank slots
        bot.simpleClick.leftMouse(window.slots[config.house.house_slot - 1].slot);
    });
    bot.on("messagestr", (message, username) => {
        if (username !== "chat") return;
        chatlog.unshift(message);
    });
    bot.on("end", (reason) => {
        if (reason == "Player Quit") {
            // save log files

            try {
                writeFile(`./bots/${path}/logs/latest-log.txt`, chatlog.join("\n"));
                // gzip compression (how?)
                let file = zlib.gzipSync(chatlog.join("\n")); // maybe it's just default recursive
                // await writeFile(`./bots/${path}/logs/${new Date()}.txt.gz`, file);
            } catch (e) {
                console.log(e);
            }
        } else initBot(false);
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

async function executeActions(actions, args) {
    for (let i = 0; i < actions.length; i++) {
        let action = structuredClone(actions[i]);

        switch (action.type) {
            case "chat":
                for (let key in args) {
                    action.message = action.message.replaceAll(`\${${key}}`, args[key]);
                }
                chatqueue.push(action.message);
                break;
            case "wait":
                await sleep(action.length);
                break;
        }
    }
}

let spinner = prompts.spinner();

parentPort.on("message", (msg) => {
    switch (msg.type) {
        case BotCommands.Start:
            path = msg.path;
            options = msg.options;
            options.onMsaCode = (data) => {
                spinner.stop();
                prompts.log.message(`Sign in at http://microsoft.com/link?otc=${data.user_code}`);
                spinner.start();
            };
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
