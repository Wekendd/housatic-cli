const { readdir, readFile } = require("node:fs/promises");
const Bot = require("./bot/bot");
const platformPath = require("./path");

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
			if (!bots.some((n) => n.name == botdirs[i])) bots.push(new Bot(botdirs[i], config));
		} catch (e) {
			log.error("Error:", e.message);
		}
	}
	if (bots.length != botdirs.length) {
		bots = bots.filter((n) => {
			if (botdirs.includes(n.name)) {
				return true;
			} else {
				if (n.status == true) n.stop();
				return false;
			}
		});
	}
}

function getBots() {
	return bots;
}

module.exports = {
	getBots,
	refreshBots,
};
