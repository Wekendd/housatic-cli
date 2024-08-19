const { intro, outro, select, confirm, isCancel, cancel, text, spinner, log } = require("@clack/prompts");
const TailingStream = require("tailing-stream");
const path = require("path");
const { refresh_bots, getBots } = require("./bots");
const { rm, writeFile, mkdir } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const { MainOptions, BotOptions } = require("./enums");
const platformPath = require("./path");

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

					const autojoin = await confirm({
						message: "House Autojoin: Should your bot join a specified house upon joining Hypixel?",
					});
					if (isCancel(autojoin)) {
						cancel("Bot creation canceled");
						continue mainmenu;
					}

					const owner = await text({
						message: "House Owner: Who owns the house you want the bot to join?",
						validate: (value) => {
							if (value.length < 3 || value.length > 16 || !/^\w+$/i.test(value)) return "Please enter a valid username.";
						},
					});
					if (isCancel(owner)) {
						cancel("Bot creation canceled");
						continue mainmenu;
					}

					const slot = await text({
						message: "House Slot: When /visiting the house owner, where is the target house in the GUI? Enter a number.",
						validate: (value) => {
							if (!/^\d+$/.test(value)) return "Please enter a number.";
						},
					});
					if (isCancel(slot)) {
						cancel("Bot creation canceled");
						continue mainmenu;
					}

					s.start("Creating new bot");
					await mkdir(`${platformPath}/bots/${name}/`);
					await writeFile(
						`${platformPath}/bots/${name}/bot.json`,
						JSON.stringify({
							house: {
								owner: owner,
								house_slot: slot,
								autojoin: autojoin,
							},
						})
					);
					await writeFile(`${platformPath}/bots/${name}/events.json`, JSON.stringify([{ type: "house_spawn", actions: [{ type: "chat", message: "/ac Hello World!" }] }]));
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
						{ value: BotOptions.Refresh, label: "Refresh bot" },
						{ value: BotOptions.Stop, label: "Stop bot" },
				  ]
				: [
						{ value: BotOptions.Start, label: "Start bot" },
						{ value: BotOptions.LogOut, label: "Log Out" },
				  ]),
			{ value: BotOptions.Console, label: "View Console" },
			{ value: BotOptions.Rename, label: "Rename bot" },
			{ value: BotOptions.Done, label: "Done (return to main menu)" },
		];

		const action = await select({
			message: "Bot Control Panel",
			options: paneloptions,
		});
		if (isCancel(action) || action === BotOptions.Done) {
			break controlmenu;
		}

		switch (action) {
			case BotOptions.Refresh:
				await bot.refresh();
				break controlmenu;

			case BotOptions.Done:
				break controlmenu;

			case BotOptions.Start:
				await bot.start();
				continue controlmenu;

			case BotOptions.Stop:
				await bot.stop();
				continue controlmenu;

			case BotOptions.Console:
				console.log("\x1Bc"); // Clear console
				console.log("\x1b[32m%s\x1b[0m", `Press "q" to exit the console view.`);

				const logFilePath = path.join(platformPath, "bots", bot.name, "logs", "latest.log");

				const stream = TailingStream.createReadStream(logFilePath, { timeout: 0 });

				stream.on("data", (buffer) => {
					process.stdout.write(buffer.toString().trimEnd());
				});

				// Prevent input echo & handle exit keys
				process.stdin.setRawMode(true);
				process.stdin.resume();
				process.stdin.setEncoding("utf-8");

				process.stdin.on("data", function (key) {
					if (key === "\u0003" || key === "q") {
						cleanup();
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

			case BotOptions.Rename:
				let newName = await text({
					message: "What do you want to rename it to?",
					validate: (value) => {
						if (!value) return "Please enter a name.";
						if (existsSync(`${platformPath}/bots/${value}`)) return "A bot is already named that!";
						if (!valid_dir(value)) return "Invalid bot name!";
					},
				});
				if (isCancel(newName)) {
					cancel("Rename operation canceled");
					continue controlmenu;
				}

				try {
					s.start("Renaming bot");
					await bot.rename(newName);
					s.stop("Bot renamed!");
				} catch (e) {
					log.error("Error!", e.message);
					break controlmenu;
				}

				continue controlmenu;

			default:
				log.warning("No functionality here yet lol");
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
