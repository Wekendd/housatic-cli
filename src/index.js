const { intro, outro, select, confirm, isCancel, cancel, text, spinner, log } = require("@clack/prompts");
const TailingStream = require("tailing-stream");
const path = require("path");
const { refresh_bots, getBots } = require("./bots");
const { rm, writeFile, mkdir } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const { MainOptions, BotOptions, ConfigureOptions } = require("./enums");
const platformPath = require("./path");

const scriptDefaultCode = `register("house_spawn", () => {
	housatic.chat("Hello world!");
});
`;

const s = spinner();

async function main() {
	intro(`Housatic`);
	await refresh_bots();
	mainmenu: while (true) {
		try {
			const action = await select({
				message: "Main Menu",
				options: [
					{ value: MainOptions.Control, label: "Control a bot" },
					{ value: MainOptions.Create, label: "Create a bot" },
					{ value: MainOptions.Delete, label: "Delete a bot" },
					{ value: MainOptions.Exit, label: "Exit the program", hint: "kills active bots!" },
				],
			});
			if (isCancel(action)) break mainmenu;

			if (action == MainOptions.Exit) break mainmenu;

			let bot;
			switch (action) {
				case MainOptions.Control:
					await refresh_bots();
					var botoptions = getBots().map((bot, index) => {
						return { value: index, label: bot.name };
					});
					botoptions.push({ value: -1, label: "Cancel" });

					botindex = await select({
						message: "Select a bot",
						options: botoptions,
					});
					if (isCancel(botindex) || botindex === -1) {
						continue mainmenu;
					}

					await control_bot(botindex);
					continue mainmenu;

				case MainOptions.Delete:
					await refresh_bots();
					var botoptions = getBots().map((bot, index) => {
						return { value: index, label: bot.name };
					});
					botoptions.push({ value: -1, label: "Cancel" });
					botindex = await select({
						message: "Select a bot",
						options: botoptions,
					});
					if (isCancel(botindex) || botindex === -1) {
						cancel("Operation canceled");
						continue mainmenu;
					}

					await getBots()[botindex].log_out();
					await delete_bot(botindex);
					continue mainmenu;

				case MainOptions.Create:
					// Create bot menu
					const name = await text({
						message: "Name: What should we call your new bot?",
						validate: (value) => {
							if (!value) return "Please enter a name.";
							if (existsSync(`${platformPath}/bots/${value}`)) return "A bot is already named that!";
							if (!valid_dir(value)) return "Invalid bot name!";
						},
					});
					if (isCancel(name)) {
						cancel("Bot creation canceled");
						continue mainmenu;
					}

					const owner = await text({
						message: "House Owner: Who owns the house your bot will be living in?",
						validate: (value) => {
							if (value.length < 3 || value.length > 16 || !/^\w+$/i.test(value)) return "Please enter a valid username.";
						},
					});
					if (isCancel(owner)) {
						cancel("Bot creation canceled");
						continue mainmenu;
					}

					const slot = await text({
						message: "House Slot: Upon running /visit, which house should the bot visit?",
						validate: (value) => {
							if (!/^\d+$/.test(value)) return "Please enter a number.";
						},
					});
					if (isCancel(slot)) {
						cancel("Bot creation canceled");
						continue mainmenu;
					}

					s.start("Creating new bot");
					// main bot dir
					await mkdir(`${platformPath}/bots/${name}/`);
					// bot manifest
					await writeFile(
						`${platformPath}/bots/${name}/bot.json`,
						JSON.stringify(
							{
								house: {
									autojoin: true,
									owner: owner,
									slot: slot,
								},
								anti_afk: true,
								advanced_mode: false,
							},
							null,
							2
						)
					);
					// script file
					await writeFile(`${platformPath}/bots/${name}/index.js`, scriptDefaultCode);
					// logs directory
					await mkdir(`${platformPath}/bots/${name}/logs/`);

					await refresh_bots();
					s.stop("New bot created!");

					continue mainmenu;
			}
		} catch (e) {
			log.error("Error!", e);
		}
	}

	outro("Exiting...");
	let bots = getBots();
	for (let i = 0; i < bots.length; i++) {
		if (bots[i].status) await bots[i].stop();
	}
	process.exit();
}

main();

/*
// Features
*/

async function control_bot(botindex) {
	let bot = getBots()[botindex]; // Getting the bot instance

	controlmenu: while (true) {
		let paneloptions = [
			...(bot.status
				? [
						{ value: BotOptions.Refresh, label: "Refresh scripts" },
						{ value: BotOptions.Stop, label: "Stop" },
				  ]
				: [
						{ value: BotOptions.Start, label: "Start" },
						{ value: BotOptions.LogOut, label: "Log Out" },
				  ]),
			{ value: BotOptions.Console, label: "View Console" },
			{ value: BotOptions.Configure, label: "Configure" },
			{ value: BotOptions.Back, label: "Back", hint: "to main menu" },
		];

		const action = await select({
			message: `Control Panel: ${bot.name}`,
			options: paneloptions,
		});
		if (isCancel(action) || action === BotOptions.Done) {
			break controlmenu;
		}

		switch (action) {
			case BotOptions.Refresh:
				bot.refresh();
				continue controlmenu;

			case BotOptions.Back:
				break controlmenu;

			case BotOptions.Start:
				await bot.start();
				continue controlmenu;

			case BotOptions.Stop:
				await bot.stop();
				continue controlmenu;

			case BotOptions.Console:
				console.log("\x1Bc"); // Clear console
				console.log("\x1b[32m%s\x1b[0m", `Console (Ctrl + C to exit):\n`);

				const logFilePath = path.join(platformPath, "bots", bot.name, "logs", "latest.log");

				const stream = TailingStream.createReadStream(logFilePath, { timeout: 0 });

				let message = "";

				stream.on("data", (buffer) => {
					process.stdout.write("\x1b[2K\x1b[1A");
					process.stdout.write(buffer.toString().trimEnd() + "\n");
					process.stdout.write(`\x1b[32mType to chat: \x1b[0m${message}`);
				});

				// Prevent input echo & handle exit keys
				process.stdin.setRawMode(true);
				process.stdin.resume();
				process.stdin.setEncoding("utf-8");

				process.stdin.on("data", function (key) {
					if (key === "\u0003") {
						cleanup();
					} else if (["\u001b[C", "\u001b[D", "\u001b[A", "\u001b[B"].includes(key)) {
						return;
					} else if (key === "\r") {
						if (message.length === 0) return;
						bot.sendMessage(message);
						message = "";
						process.stdout.write(`\x1b[2K\x1b[1G\x1b[32mType to chat: \x1b[0m${message}`);
					} else if (key === "\x08") {
						message = message.substring(0, message.length - 1);
						process.stdout.write(`\x1b[2K\x1b[1G\x1b[32mType to chat: \x1b[0m${message}`);
					} else {
						message += key;
						process.stdout.write(`\x1b[2K\x1b[1G\x1b[32mType to chat: \x1b[0m${message}`);
					}
				});

				const cleanup = () => {
					stream.destroy();
					process.stdin.setRawMode(false);
					process.stdin.removeAllListeners("data");
					console.log("\x1Bc"); // Clear console
				};

				await new Promise((resolve) => stream.on("close", resolve));
				continue controlmenu;

			case BotOptions.LogOut:
				s.start("Logging out");
				await bot.log_out();
				s.stop("Logged out!");
				continue controlmenu;

			case BotOptions.Configure:
				let setting = await select({
					message: `Configuring ${bot.name}`,
					options: [
						{ value: ConfigureOptions.Rename, label: "Rename", hint: `Currently: ${bot.name}` },
						{ value: ConfigureOptions.HouseOwner, label: "Change house owner", hint: `Currently: ${bot.config.house.owner}` },
						{ value: ConfigureOptions.HouseSlot, label: "Change house slot", hint: `Currently: ${bot.config.house.slot}` },
						{ value: ConfigureOptions.AntiAFK, label: "Toggle Anti AFK", hint: `Currently: ${bot.config.anti_afk}` },
						{ value: ConfigureOptions.AdvancedMode, label: "Toggle Advanced Mode", hint: `Currently: ${bot.config.advanced_mode}` },
						{ value: ConfigureOptions.Back, label: "Back", hint: "to bot panel" },
					],
				});

				switch (setting) {
					case ConfigureOptions.Rename:
						let new_name = await text({
							message: "Enter a new name for the bot!",
							validate: (value) => {
								if (!value) return "Please enter a name.";
								if (existsSync(`${platformPath}/bots/${value}`)) return "A bot is already named that!";
								if (!valid_dir(value)) return "Invalid bot name!";
							},
						});
						if (isCancel(new_name)) {
							cancel("Rename operation canceled");
							break;
						}

						try {
							s.start("Renaming bot");
							await bot.rename(new_name);
							s.stop("Bot renamed!");
						} catch (e) {
							log.error("Error!", e.message);
							break;
						}

						await refresh_bots();
						return await control_bot(botindex);
						break;

					case ConfigureOptions.HouseOwner:
						let new_owner = await text({
							message: "Enter a new username for the bot to visit!",
							validate: (value) => {
								if (value.length < 3 || value.length > 16 || !/^\w+$/i.test(value)) return "Please enter a valid username.";
							},
						});
						if (isCancel(new_owner)) {
							cancel("House owner change canceled");
							break;
						}

						upd_config = bot.config;
						upd_config.house.owner = new_owner;

						s.start("Changing target house owner");
						await writeFile(`${bot.path}/bot.json`, JSON.stringify(upd_config, null, 2), (err) => {
							if (err) return log.error("Error while writing to bot.json!", e.message);
						});
						s.stop(`Changed target house owner to ${new_owner}!`);

						break;

					case ConfigureOptions.HouseSlot:
						let new_slot = await text({
							message: "Enter a new house slot for the bot to visit!",
							validate: (value) => {
								if (!/^\d+$/.test(value)) return "Please enter a number.";
							},
						});
						if (isCancel(new_slot)) {
							cancel("House slot change canceled");
							break;
						}

						upd_config = bot.config;
						upd_config.house.slot = new_slot;

						s.start("Changing target house slot");
						await writeFile(`${bot.path}/bot.json`, JSON.stringify(upd_config, null, 2), (err) => {
							if (err) return log.error("Error while writing to bot.json!", e.message);
						});
						s.stop(`Changed target house slot to ${new_slot}!`);

						break;

					case ConfigureOptions.AdvancedMode:
						try {
							if (bot.config.advanced_mode) {
								upd_config = bot.config;
								upd_config.advanced_mode = false;

								await writeFile(`${bot.path}/bot.json`, JSON.stringify(upd_config, null, 2), (err) => {
									if (err) return log.error("Error while writing to bot.json!", e.message);
								});

								log.success("Disabled advanced mode!");
							} else {
								let confirm_enable = await confirm({
									message: "WARNING! Enabling advanced mode makes your computer vulerable to malicious scripts! Only use code you trust in Housatic scripts. Do you want to continue?",
								});
								if (isCancel(confirm_enable) || !confirm_enable) {
									cancel("Canceled enabling advanced mode");
									break;
								}

								upd_config = bot.config;
								upd_config.advanced_mode = true;

								await writeFile(`${bot.path}/bot.json`, JSON.stringify(upd_config, null, 2), (err) => {
									if (err) return log.error("Error while writing to bot.json!", e.message);
								});

								log.success("Enabled advanced mode!");
							}
						} catch (e) {
							console.log(e);
						}

					case ConfigureOptions.AntiAFK:
						upd_config = bot.config;
						upd_config.anti_afk = !upd_config.anti_afk;

						await writeFile(`${bot.path}/bot.json`, JSON.stringify(upd_config, null, 2), (err) => {
							if (err) return log.error("Error while writing to bot.json!", e.message);
						});

						log.success(`${upd_config.anti_afk ? "Enabled" : "Disabled"} anti AFK!`);
				}
				continue controlmenu;
		}
	}
}

async function delete_bot(botindex) {
	const bot = getBots()[botindex];

	const confirm_del = await confirm({
		message: `Are you sure you want to delete "${bot.name}"? All associated events, functions, and data will be permanently removed.`,
	});
	if (isCancel(confirm_del) || !confirm_del) {
		cancel("Delete operation aborted!");
		return;
	}

	s.start("Deleting bot");
	await rm(bot.path, { recursive: true });
	await refresh_bots();
	s.stop("Bot deleted!");
}

/*
// Utils
*/

// Check if directory name is valid
function valid_dir(name) {
	// Invalid characters for Windows, macOS, and Linux
	const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;

	// Check if the name contains invalid characters
	if (invalidChars.test(name)) return false;

	// Check for reserved folder names (windows-specific)
	const reservedNames = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
	if (reservedNames.includes(name.toUpperCase())) return false;

	// Check if the name ends with a space or a period (Windows-specific)
	if (/[. ]$/.test(name)) return false;

	return true;
}
