import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from './command.interface';
import { config } from '../config';

export const serversCommand: Command = {
  name: 'servers',
  description: 'Lists all servers the bot is currently in. (Owner only)',
  details: 'This command provides a list of all Discord servers (guilds) that Blade Bot is a member of, along with their respective IDs. This is useful for monitoring bot presence.',
  usage: '*servers',
  examples: ['*servers'],
  execute: async (message: Message, args: string[], client: Client) => {
    // Owner check
    if (!config.OWNER_ID) {
        await message.reply('This command is disabled because no OWNER_ID is configured.');
        return;
    }

    if (message.author.id !== config.OWNER_ID) {
      await message.reply('Only the bot owner can use this command.');
      return;
    }

    const guilds = client.guilds.cache;

    if (guilds.size === 0) {
      await message.reply('I am not currently in any servers.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🌐 Servers Blade Bot is In')
      .setDescription(`I am currently in **${guilds.size}** server(s):`);

    guilds.forEach(guild => {
      embed.addFields({ name: guild.name, value: `ID: ${guild.id}`, inline: false });
    });

    await message.reply({ embeds: [embed] });
  },
};
