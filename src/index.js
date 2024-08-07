const prompts = require('@clack/prompts');
const { refreshBots, getBotDirs, getBots } = require('./bots');
const { rmdir, writeFile, mkdir } = require('node:fs/promises');
const { MainOptions, BotOptions } = require('./enums');
const platformPath = require('./path');

async function main() {
    prompts.intro(`Housatic`);
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
                let botName = await prompts.text({
                    message: "Bot name"
                });
                let houseOwner = await prompts.text({
                    message: "House owner"
                });
                let houseSlot = await prompts.text({
                    message: "House slot"
                });
                let autojoin = await prompts.confirm({
                    message: "Do you want autojoin enabled?"
                });
                
                let spinner = prompts.spinner();
                spinner.start();
                await mkdir(`${platformPath}/bots/${botName}/`);
                await writeFile(`${platformPath}/bots/${botName}/bot.json`, JSON.stringify({ house: { owner: houseOwner, house_slot: houseSlot, autojoin: autojoin } }));
                await writeFile(`${platformPath}/bots/${botName}/events.json`, JSON.stringify([{ type: "house_spawn", actions: [{ type: "chat", message: "/ac Hello World!" }] }]));
                await mkdir(`${platformPath}/bots/${botName}/logs/`);
                await refreshBots();
                spinner.stop();
                break;
        }

        if (botdir === -1 || MainOptions.Create == option) continue;

        if (option == MainOptions.Delete) {
            await rmdir(`${platformPath}/bots/${getBotDirs()[botdir]}`, { recursive: true });
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
    
            switch (control) {
                case BotOptions.Done:
                    controlling = false;
                    continue;
                
                case BotOptions.Start:
                    await bot.start();
                    continue;

                case BotOptions.Stop:
                    bot.stop();
                    continue;

                // case BotOptions.Console:
                //     bot.getConsole().then((logs) => {
                //         prompts.log.message(logs.join("\n"));
                //     });
                //     continue;

                case BotOptions.LogOut:
                    var spinner = prompts.spinner();
                    spinner.start();
                    await bot.logOut();
                    spinner.stop(); 
                    continue;
                
                case BotOptions.Refresh:
                    var spinner = prompts.spinner();
                    spinner.start();
                    await bot.refresh();
                    spinner.stop();
                    continue;
                
                default:
                    prompts.log.message("No functionality here yet lol");
            }
        }} catch (e) {console.log(e)}
    }

    prompts.outro("Exiting...");
    process.exit();
}

main();