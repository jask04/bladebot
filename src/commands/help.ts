import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from './command.interface';
import { commands } from '../index'; // We will export the command collection from index or a central place

export const helpCommand: Command = {
  name: 'help',
  description: 'Shows all available bot commands',
  execute: async (message: Message, args: string[], client: Client) => {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Blade Bot Commands')
      .setDescription('Here are the available commands for Blade Bot:');

    commands.forEach((cmd) => {
      embed.addFields({ name: `*${cmd.name}`, value: cmd.description });
    });

    await message.channel.send({ embeds: [embed] });
  },
};
