const { parentPort } = require("worker_threads");
const { BotCommands } = require("../enums");
const mineflayer = require("mineflayer");
const prompts = require("@clack/prompts");
const { writeFile } = require("node:fs/promises");
const zlib = require("node:zlib");
const fs = require("fs");
const vm = require("vm");

const s = prompts.spinner();

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

function botLocation() {
	if (bot.scoreboard[1] === undefined) return "limbo"; // In limbo
	if (bot.scoreboard[1].name === "Housing") return "lobby_housing"; // In the housing lobby
	else if (bot.scoreboard[1].name === "housing") return "house"; // In a house
	else return "lobby_other"; // In a different lobby or smth else
}

function reloadEvents(first) {
	if (!bot) return;

	if (!first) bot.removeAllListeners();

	const script = fs.readFileSync(`${path}/index.js`, "utf-8");

	const sandbox = {
		mineflayer: bot,
		housatic: custom_actions, // custom events, custom methods, etc
	};

	const context = vm.createContext(sandbox);

	// execute code in context of bot object
	try {
		vm.runInContext(script, context);
	} catch (e) {
		return console.log(`Scripting error! ${e}`);
	}

	if (first) {
		bot.once("login", () => {
			s.stop("Bot started");
			setTimeout(() => parentPort.postMessage({ type: BotCommands.Started }), 100); // slight delay because apparently the spinner doesn't instantly stop or smth stupid
		});
	}

	// required events to function

	// Autojoin commands
	bot.on("spawn", async () => {
		await sleep(1000);
		if (botLocation() === "limbo") return chatqueue.push("/hub housing");
		if (botLocation() === "lobby_housing") {
			// check config
			if (config.house?.autojoin) {
				return chatqueue.push({ message: `/visit ${config.house.owner}` });
			}
		}
	});

	// Autojoin visit GUI
	bot.on("windowOpen", (window) => {
		if (botLocation() !== "lobby_housing") return;
		if (!config.house?.autojoin) return;
		window.slots = window.slots.filter((n) => n); // filter out blank slots
		bot.simpleClick.leftMouse(window.slots[config.house.slot - 1].slot);
	});

	// Log chat
	bot.on("messagestr", (message, username) => {
		if (username !== "chat") return;
		chatlog.push(message);
		writeFile(`${path}/logs/latest.log`, chatlog.join("\n"));
	});

	// Zip log
	bot.on("end", async (reason) => {
		if (reason == "Player Quit") {
			// write latest.log to zipped file
			try {
				let file = zlib.gzipSync(chatlog.join("\n"));
				let date = new Date();
				await writeFile(`${path}/logs/${date.toISOString().replaceAll(":", "-").replaceAll(".", "-")}.log.gz`, file);
			} catch (e) {
				console.log(e);
			}
			parentPort.postMessage({ type: BotCommands.Stop });
		} else initBot(false);
	});

	// Quit on error
	bot.on("error", (err) => {
		bot.quit();
	});

	// bot chat queue
	bot.on("physicsTick", () => {
		if (chatqueue.length == 0) return;
		ticks--;
		if (ticks <= 0) {
			let message = chatqueue.shift();
			bot.chat(message.message);
			if (message.resolve) message.resolve();
			if (chatqueue.length > 0) ticks = 30;
		}
	});
}

async function initBot(first) {
	bot = mineflayer.createBot(options);
	reloadEvents(first);
}

parentPort.on("message", (msg) => {
	switch (msg.type) {
		case BotCommands.Start:
			chatqueue = [];
			chatlog = [];
			options = msg.options;
			options.onMsaCode = (data) => {
				s.stop();
				console.log("\x1b[F\x1b[F\x1b[F");
				prompts.note(`Sign in at http://microsoft.com/link?otc=${data.user_code}`, "Log in to a Minecraft account:");
				s.start("Waiting");
			};
			config = msg.config;
			events = msg.events;
			path = msg.path;
			s.start("Starting bot");
			initBot(true);
			break;
		case BotCommands.Stop:
			bot.quit("Player Quit");
			break;
		case BotCommands.Refresh:
			config = msg.config;
			path = msg.path;

			if (bot) chatqueue.push({ message: "/hub housing" });

			reloadEvents(false);

			parentPort.postMessage({ type: BotCommands.RefreshDone });
			break;
		case BotCommands.Rename:
			path = msg.path;
			try {
				options.username = msg.name;
			} catch (e) {}
			break;
		case BotCommands.SendMessage:
			chatqueue.push({ message: msg.message });
		default:
			break;
	}
});

const custom_actions = {
	chat(message) {
		let res;
		let promise = new Promise((resolve, reject) => {
			res = resolve;
		});
		chatqueue.push({ message: message, resolve: res });
		return promise; 
	},
	log(message) {
		chatlog.push(message);
		writeFile(`${path}/logs/latest.log`, chatlog.join("\n"));
	},

	on(event, callback) {
		switch (event) {
			case "house_spawn":
				bot.on("spawn", async () => {
					await sleep(1000);
					if (botLocation() !== "house") return

					const event_object = {
						type: "spawn",
						timestamp: Date.now(),
					}

					callback(event_object);
				});
				break;

			// event for chat since we want criterias + mineflayer chat messages are a bit goofy
			case "chat":
				bot.on("messagestr", (raw_message, username) => {
					if (username !== "chat") return;
					if (botLocation() !== "house") return;

					const chatRegex = /^(?: \+ )?(?:(?:\[.+]) )?(?<sender>[a-zA-Z0-9_]{2,16}): (?<message>.+)/;
					if (!chatRegex.test(raw_message)) return;

					const { sender, message } = chatRegex.exec(raw_message).groups;
					const event_object = {
						type: "chat",
						sender: sender,
						message: message,
						timestamp: Date.now(),
					}
					callback(event_object);
				});
				break;

			default:
				throw Error(`Unknown event: ${event}`);
		}
	},
};
