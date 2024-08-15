const prompts = require("@clack/prompts");
const TailingStream = require("tailing-stream");
const path = require("path");
const { refreshBots, getBotDirs, getBots } = require("./bots");
const { rm, writeFile, mkdir } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const { MainOptions, BotOptions } = require("./enums");
const platformPath = require("./path");

async function main() {
	prompts.intro(`Housatic`);
	await refreshBots();
	while (true) {
		try {
			const option = await prompts.select({
				message: "Main Menu",
				options: [
					{ value: MainOptions.Control, label: "Control a bot" },
					{ value: MainOptions.Create, label: "Create a bot" },
					{ value: MainOptions.Delete, label: "Delete a bot" },
					{ value: MainOptions.Exit, label: "Exit the program", hint: "kills active bots!" },
				],
			});

			if (option == MainOptions.Exit) break;

			let botdir;
			switch (option) {
				case MainOptions.Control:
				case MainOptions.Delete:
					await refreshBots();
					var botoptions = getBotDirs().map((botname, index) => {
						return { value: index, label: botname };
					});
					botoptions.push({ value: -1, label: "Cancel" });
					botdir = await prompts.select({
						message: "Select a bot",
						options: botoptions,
					});
					break;
				case MainOptions.Create:
					// Create bot menu
					let botName = await prompts.text({
						message: "Name: What should we call your new bot?",
					});
                    let autojoin = await prompts.confirm({
                        message: "House Autojoin: Should your bot join a specified house upon joining Hypixel?",
                    });
					let houseOwner = await prompts.text({
						message: "House Owner: Who owns the house you want the bot to join?",
					});
					let houseSlot = await prompts.text({
						message: "House Slot: When /visiting the house owner, where is the target house in the GUI? Enter a number.",
					});

					let spinner = prompts.spinner();
					spinner.start("Creating new bot...");
					await mkdir(`${platformPath}/bots/${botName}/`);
					await writeFile(
						`${platformPath}/bots/${botName}/bot.json`,
						JSON.stringify({
							house: { owner: houseOwner, house_slot: houseSlot, autojoin: autojoin },
						})
					);
					await writeFile(
						`${platformPath}/bots/${botName}/events.json`,
						JSON.stringify([
							{ type: "house_spawn", actions: [{ type: "chat", message: "/ac Hello World!" }] },
						])
					);
					await mkdir(`${platformPath}/bots/${botName}/logs/`);
					await refreshBots();
					spinner.stop("New bot created");
					break;
			}

			if (botdir === -1 || MainOptions.Create == option) continue;

			if (option == MainOptions.Delete) {
				await rm(`${platformPath}/bots/${getBotDirs()[botdir]}`, { recursive: true });
				await refreshBots();
				continue;
			}

			/*
                CONTROL
            */

			let bot = getBots()[botdir]; // Getting the bot instance

			// Panel
			let controlling = true;
			while (controlling) {
				let paneloptions = [
					{ value: BotOptions.Console, label: "View Console" },
					{ value: BotOptions.Rename, label: "Rename bot" },
					{ value: BotOptions.Done, label: "Done (return to main menu)" },
				];
				if (bot.status == true) {
					paneloptions.unshift({ value: BotOptions.Stop, label: "Stop bot" });
					paneloptions.unshift({ value: BotOptions.Refresh, label: "Refresh bot" });
				} else {
					paneloptions.unshift({ value: BotOptions.LogOut, label: "Log Out" });
					paneloptions.unshift({ value: BotOptions.Start, label: "Start bot" });
				}

				const control = await prompts.select({
					message: "Bot Control Panel",
					options: paneloptions,
				});

				switch (control) {
					case BotOptions.Done:
						controlling = false;
						continue;

					case BotOptions.Start:
						await bot.start();
						continue;

					case BotOptions.Stop:
						await bot.stop();
						continue;

					case BotOptions.Console:
						console.log("\x1Bc"); // Clear console
						console.log('\x1b[32m%s\x1b[0m', `Press "q" to exit the console view.`);

						const logFilePath = path.join(
							platformPath,
							"bots",
							getBotDirs()[botdir],
							"logs",
							"latest.log"
						);

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
						continue;

					case BotOptions.LogOut:
						var spinner = prompts.spinner();
						spinner.start("Logging out...");
						await bot.logOut();
						spinner.stop("Logged out");
						continue;

					case BotOptions.Rename:
						let newName = await prompts.text({
							message: "What do you want to rename it to?",
						});
						if (existsSync(`${platformPath}/bots/${newName}`)) {
							prompts.log.error("A bot is already named that!");
						} else {
							try {
								var spinner = prompts.spinner();
								spinner.start("Renaming bot...");
								await bot.rename(newName);
								spinner.stop("Bot renamed");
							} catch (e) {
								prompts.log.error("Issue renaming bot. Are you sure the name is valid?");
							}
						}
						break;
					default:
						prompts.log.message("No functionality here yet lol");
				}
			}
		} catch (e) {
			console.log(e);
		}
	}

	prompts.outro("Exiting...");
	let bots = getBots();
	for (let i = 0; i < bots.length; i++) {
		if (bots[i].status == true) await bots[i].stop();
	}
	process.exit();
}

main();
