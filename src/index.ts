import * as prompts from '@clack/prompts';
import { refreshBots, botdirs } from './bots';
import { rmdir } from 'node:fs/promises';

enum MainOptions {
    Control,
    Create,
    Delete,
    Refresh,
    Exit
}
enum BotOptions {
    Start,
    Stop,
    Refresh,
    Rename,
    Console,
    Done
}

async function main() {
    prompts.intro(`Bot Interface`);
    await refreshBots();

    while (true) {
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

        let bot: any;
        switch (option) {
            case MainOptions.Control:
            case MainOptions.Delete:
                var botoptions = botdirs.map((botname, index) => { return { value: index, label: botname } });
                botoptions.push({ value: -1, label: "Cancel" })
                bot = await prompts.select({
                    message: "Select a bot",
                    options: botoptions as any
                });
                break;
            case MainOptions.Create:
                // Create bot menu
                break;
        }

        if (option == MainOptions.Create || bot === -1) continue;
        if (option == MainOptions.Delete) {
            await rmdir(`./bots/${botdirs[bot]}`, { recursive: true });
            await refreshBots();
            continue;
        }

        /*
            CONTROL
        */

        // Getting the bot instance

        // Panel
        let controlling = true;
        while (controlling) {
            let paneloptions: { value: unknown; label: string; hint?: string; }[] = [
                { value: BotOptions.Console, label: "View Console" },
                { value: BotOptions.Rename, label: "Rename bot" },
                { value: BotOptions.Done, label: "Done (return to main menu)" }
            ];
            paneloptions.unshift({ value: BotOptions.Start, label: "Start bot" }) // Eventually turn it into an if statement to add refreshing/stopping dynamics

            const control = await prompts.select({
                message: "What do you want to do?",
                options: paneloptions
            });
    
            if (control == BotOptions.Done) {
                controlling = false;
                continue;
            }

            prompts.log.message("No functionality here yet lol");
        }
    }

    prompts.outro("Exiting...");
}

main();