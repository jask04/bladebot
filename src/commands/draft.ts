import { Message, Client } from 'discord.js';
import { Command } from './command.interface';
import { DraftService } from '../services/draft-service';
import { config } from '../config'; // Import the config

export const draftCommand: Command = {
  name: 'draft',
  description: 'Uses Puppeteer to create a custom draft room on draftlol.dawe.gg and returns the Blue, Red, and Spectator links.',
  details: 'Launches a headless browser instance to interact with draftlol.dawe.gg. It automatically clicks "Create Room" and scrapes the generated Blue, Red, and Spectator links.\n\n**(Jask Only):** This command is restricted to the bot owner.',
  usage: '*draft',
  examples: ['*draft'],
  execute: async (message: Message, args: string[], client: Client) => {
    // Owner check
    if (message.author.id !== config.OWNER_ID) {
      await message.reply('only jask can use it');
      return;
    }

    await message.reply('Testing Draft generation... (This opens a browser in the background, please wait)');

    try {
        const links = await DraftService.createDraft();
        
        if (links) {
            await message.reply(`**Success!**\nBlue: <${links.blue}>\nRed: <${links.red}>\nSpectator: <${links.spectator}>`);
        } else {
            await message.reply('**Failed** to generate links. Check console for logs.');
        }
    } catch (e) {
        console.error(e);
        await message.reply(`**Error:** ${e}`);
    }
  },
};
