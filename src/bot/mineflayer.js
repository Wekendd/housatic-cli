const { parentPort } = require("worker_threads");
const { BotCommands } = require("../enums");
const mineflayer = require("mineflayer");
const prompts = require("@clack/prompts");
const { writeFile } = require("node:fs/promises");
const zlib = require("node:zlib");
const crypto = require("crypto");
const fs = require("fs");
const { platformPath } = require("../path");
const { NodeVM, VMScript } = require("vm2");

const s = prompts.spinner();

const script_events = [];
let bot;
let options;
let chatlog = [];
let config;
let chatqueue = [];
let ticks = 0;
let path;

console.info = (info) => {
	if (info == "[msa] Signed in with Microsoft") return;
};

/*
// Events n stuff
*/

function loadEvents(first) {
	if (!bot) return;

	if (first) {
		bot.once("login", () => {
			s.stop("Bot started");
			setTimeout(() => parentPort.postMessage({ type: BotCommands.Started }), 100); // slight delay because apparently the spinner doesn't instantly stop or smth stupid
		});
	}

	// Required events to function

	// Autojoin commands
	bot.on("spawn", async () => {
		await sleep(1000);
		if (getLocation() === "limbo") return chatqueue.push("/hub housing");
		if (getLocation() === "lobby_housing") {
			if (config.house?.autojoin) return chatqueue.push({ message: `/visit ${config.house.owner}` });
		}
	});

	// Autojoin visit GUI
	bot.on("windowOpen", (window) => {
		if (getLocation() !== "lobby_housing") return;
		if (!config.house?.autojoin) return;
		window.slots = window.slots.filter((n) => n); // filter out blank slots
		bot.simpleClick.leftMouse(window.slots[config.house.slot - 1].slot);
	});

	// Log chat
	bot.on("messagestr", (message, username) => {
		if (username !== "chat") return;
		chatlog.push(message);
		writeFile(`${path}/logs/latest.log`, chatlog.join("\n"));

		if (config.anti_afk && (message === "You are AFK. Move around to return from AFK." || message === "A kick occurred in your connection, so you have been routed to limbo!")) {
			housatic.chat(`/lobby housing`);
		}
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
			bot.chat(String(message.message));
			if (message.resolve) message.resolve();
			if (chatqueue.length > 0) ticks = 30;
		}
	});

	// Load scripts
	bot.once("spawn", () => {
		// Custom chat events
		bot.addChatPattern(
			"house_crash",
			/(?:An exception occurred in your connection, so you were put in the Housing Lobby!)|(?:A kick occurred in your connection, so you were put in the Housing Lobby!)|(?:A disconnect occurred in your connection, so you were put in the Housing Lobby!)/
		);
		// bot.addChatPattern("all", /.+/);
		// bot.addChatPattern("message", /^From(?: \[(?<rank>VIP\+?|MVP\+?\+?)\])? (?<username>[a-zA-Z0-9_]{2,16}): (?<message>.+)$/m, { parse: true });

		loadScripts();
	});
}

async function initBot(first) {
	bot = mineflayer.createBot(options);
	loadEvents(first);
}

// Bot control
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

			if (bot) {
				chatqueue.push({ message: "/hub housing" });
				loadScripts();
			}

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

function loadScripts() {
	// Remove old script listeners
	if (script_events.length > 0)
		script_events.forEach((event) => {
			bot.removeListener(event.event, event.listener);
		});

	// Run script with context
	const scriptPath = `${path}/index.js`;

	const vm = new NodeVM({
		require: {
			external: config.advanced_mode,
			root: platformPath,
		},
		sandbox: {
			mineflayer: bot,
			register: custom_events,
			housatic: custom_methods,
			console: custom_console,
		},
	});

	const script = new VMScript(fs.readFileSync(scriptPath, "utf-8"), { filename: scriptPath });

	try {
		vm.run(script);
	} catch (e) {
		return prompts.log.error(`Scripting error! ${e}`);
	}
}

/*
// Custom thingies
*/

const custom_console = {
	log: (...args) => {
		chatlog.push(args.join(" "));
		writeFile(`${path}/logs/latest.log`, chatlog.join("\n"));
	},
};

const custom_methods = {
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
	wait(length) {
		return new Promise((resolve, reject) => {
			setTimeout(resolve, length);
		});
	},
	getLocation,
};

const custom_events = (event, callback, criteria = null) => {
	switch (event) {
		case "house_spawn":
			const house_spawn_listener = async () => {
				await sleep(1000);
				if (getLocation() !== "house") return;
				callback();
			};
			bot.on("spawn", house_spawn_listener);
			script_events.push({ event: event, listener: house_spawn_listener });
			break;

		case "house_crash":
			const house_crash_listener = () => callback();
			bot.on("chat:house_crash", house_crash_listener);
			script_events.push({ event: `chat:house_crash`, listener: house_crash_listener });

		case "chat":
			if (criteria !== null) {
				const regex = new RegExp(criteria.replace(/[-[\]()*+?.,\\^$|#\s]/g, "\\$&").replace(/{(\w+)}/g, "(?<$1>.+)"));

				let id = crypto.randomUUID();
				bot.addChatPattern(id, regex, { parse: true });
				const chat_criteria_listener = (matches) => {
					callback(...matches[0]);
				};
				bot.on(`chat:${id}`, chat_criteria_listener);
				script_events.push({ event: `chat:${id}`, listener: chat_criteria_listener });

				break;
			}

		default:
			const mineflayer_listener = (...args) => {
				callback(...args);
			};
			bot.on(event, mineflayer_listener);
			script_events.push({ event: event, listener: mineflayer_listener });
			break;
	}
};

/*
// Utils
*/

function sleep(wait) {
	return new Promise((resolve) => setTimeout(() => resolve(), wait));
}

function getLocation() {
	if (bot.scoreboard[1] === undefined) return "limbo"; // In limbo
	if (bot.scoreboard[1].name === "Housing") return "lobby_housing"; // In the housing lobby
	else if (bot.scoreboard[1].name === "housing") return "house"; // In a house
	else return "lobby_other"; // In a different lobby or smth else
}
