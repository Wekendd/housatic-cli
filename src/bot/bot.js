const { unlink, readdir, readFile, rename, mkdir, stat, rmdir } = require("node:fs/promises");
const { Worker } = require("worker_threads");
const _path = require("path");
const { BotCommands } = require("../enums");
const crypto = require("crypto");
const platformPath = require("../path");

function createHash(input) {
	return crypto
		.createHash("sha1")
		.update(input ?? "", "binary")
		.digest("hex")
		.substring(0, 6);
}

module.exports = class Bot {
	options;
	name;
	path;
	status;
	bot;
	config;
	events;

	constructor(name, config) {
		this.name = name;
		this.path = `${platformPath}/bots/${name}`;
		this.refresh();
		this.status = false;
		try {
			this.bot = new Worker(_path.join(__dirname, "./mineflayer.js"));
		} catch (e) {
			console.log(e);
		}
		this.config = config;
		this.options = {
			host: "hypixel.net",
			auth: "microsoft",
			version: "1.8.9",
			username: this.name,
			profilesFolder: `${platformPath}/profiles`,
		};
	}

	async refresh() {
		try {
			this.config = JSON.parse(await readFile(`${this.path}/bot.json`, "utf-8"));

			this.bot.postMessage({
				type: BotCommands.Refresh,
				config: this.config,
				path: this.path
			});
		} catch (e) {
			reject();
		}
	}

	start() {
		return new Promise((resolve, reject) => {
			this.bot.on("message", (data) => {
				if (data.type != BotCommands.Started) return;
				this.status = true;
				resolve();
			});
			this.bot.postMessage({
				type: BotCommands.Start,
				options: this.options,
				config: this.config,
				events: this.events,
				path: this.path,
			});
		});
	}

	stop() {
		return new Promise((resolve, reject) => {
			this.bot.on("message", (data) => {
				if (data.type != BotCommands.Stop) return;
				this.status = false;
				resolve();
			});
			this.bot.postMessage({ type: BotCommands.Stop });
		});
	}

	async log_out() {
		let hash = createHash(this.path);
		let caches = await readdir(`${platformPath}/profiles/`);
		if (caches.includes(`${hash}_live-cache.json`)) await unlink(`${platformPath}/profiles/${hash}_live-cache.json`);
		if (caches.includes(`${hash}_mca-cache.json`)) await unlink(`${platformPath}/profiles/${hash}_mca-cache.json`);
		if (caches.includes(`${hash}_xbl-cache.json`)) await unlink(`${platformPath}/profiles/${hash}_xbl-cache.json`);
	}

	async rename(newName) {
		let hash = createHash(this.path);
		let newHash = createHash(newName);
		let caches = await readdir(`${platformPath}/profiles/`);
		if (caches.includes(`${hash}_live-cache.json`)) await rename(`${platformPath}/profiles/${hash}_live-cache.json`, `${platformPath}/profiles/${newHash}_live-cache.json`);
		if (caches.includes(`${hash}_mca-cache.json`)) await rename(`${platformPath}/profiles/${hash}_mca-cache.json`, `${platformPath}/profiles/${newHash}_mca-cache.json`);
		if (caches.includes(`${hash}_xbl-cache.json`)) await rename(`${platformPath}/profiles/${hash}_xbl-cache.json`, `${platformPath}/profiles/${newHash}_xbl-cache.json`);
		this.bot.postMessage({ type: BotCommands.Rename, name: newName });
		await rename_dir(this.path, `${platformPath}/bots/${newName}`);
		this.path = newName;
		this.options.username = newName;
	}

	sendMessage(message) {
		if (!this.status) return;
		this.bot.postMessage({ type: BotCommands.SendMessage, message: message });
	}
};

async function rename_dir(oldPath, newPath) {
	try {
		// Create the new directory if it doesn't exist
		await mkdir(newPath, { recursive: true });

		// Read the contents of the old directory
		let contents = await readdir(oldPath);

		// Recursively rename each item
		for (let item of contents) {
			let oldItemPath = _path.join(oldPath, item);
			let newItemPath = _path.join(newPath, item);
			let itemStats = await stat(oldItemPath);

			if (itemStats.isDirectory()) {
				await rename_dir(oldItemPath, newItemPath);
			} else {
				await rename(oldItemPath, newItemPath);
			}
		}

		await rmdir(oldPath);
	} catch (err) { }
}
