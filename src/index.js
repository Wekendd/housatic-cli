const prompts = require('@clack/prompts');
const { refreshBots, getBotDirs, getBots } = require('./bots');
const { rmdir } = require('node:fs/promises');
const { MainOptions, BotOptions } = require('./enums');

async function main() {
    prompts.intro(`Bot Interface`);
    await refreshBots();
    while (true) {
        try {
        const option = await prompts.select({
            message: "Control Panel",
            options: [
                { value: MainOptions.Control, label: "Control a bot" },
                { value: MainOptions.Create, label: "Create a bot" },
                { value: MainOptions.Delete, label: "Delete a bot" },
                { value: MainOptions.Refresh, label: "Refresh bot list" },
                { value: MainOptions.Exit, label: "Exit the program" }
            ]
        });

        if (option == MainOptions.Exit) break;
        if (option == MainOptions.Refresh) {
            await refreshBots();
            continue;
        }

        let botdir;
        switch (option) {
            case MainOptions.Control:
            case MainOptions.Delete:
                var botoptions = getBotDirs().map((botname, index) => { return { value: index, label: botname } });
                botoptions.push({ value: -1, label: "Cancel" })
                botdir = await prompts.select({
                    message: "Select a bot",
                    options: botoptions
                });
                break;
            case MainOptions.Create:
                // Create bot menu
                break;
        }

        if (option == MainOptions.Create || botdir === -1) continue;
        if (option == MainOptions.Delete) {
            await rmdir(`./bots/${getBotDirs()[botdir]}`, { recursive: true });
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
                { value: BotOptions.Done, label: "Done (return to main menu)" }
            ];
            if (bot.status == true) {
                paneloptions.unshift({ value: BotOptions.Stop, label: "Stop bot"});
                paneloptions.unshift({ value: BotOptions.Refresh, label: "Refresh bot"});
            } else {
                paneloptions.unshift({ value: BotOptions.LogOut, label: "Log Out" });
                paneloptions.unshift({ value: BotOptions.Start, label: "Start bot" });
            }

            const control = await prompts.select({
                message: "What do you want to do?",
                options: paneloptions
            });
    
            if (control == BotOptions.Done) {
                controlling = false;
                continue;
            }

            if (control == BotOptions.Start) {
                await bot.start();
                continue;
            }

            if (control == BotOptions.Stop) {
                bot.stop();
                continue;
            }

            if (control == BotOptions.Console) {
                bot.getConsole().then((logs) => {
                    prompts.log.message(logs.join("\n"));
                });
                continue;
            }

            if (control == BotOptions.LogOut) {
                let spinner = prompts.spinner();
                spinner.start();
                await bot.logOut();
                spinner.stop(); 
                continue;
            }

            if (control == BotOptions.Refresh) {
                let spinner = prompts.spinner();
                spinner.start();
                await bot.refresh();
                spinner.stop();
                continue;
            }

            prompts.log.message("No functionality here yet lol");
        }} catch (e) {console.log(e)}
    }

    prompts.outro("Exiting...");
    process.exit();
}

main();