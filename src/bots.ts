import * as prompts from '@clack/prompts';
import { readdir, readFile } from "node:fs/promises";

export let botdirs: String[];

export async function refreshBots() {
    prompts.log.message("Loading ...");
    prompts.spinner();
    botdirs = await readdir("./bots/");
    botdirs = botdirs.filter(async (dir) => {
        let credentials = JSON.parse(await readFile(`./bots/${dir}/credentials.json`, "utf-8"));
        if (!credentials) return false;
    });
}