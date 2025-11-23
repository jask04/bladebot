import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from './command.interface';
import { commands } from '../core/command-registry';

export const helpCommand: Command = {
  name: 'help',
  description: 'Shows all available bot commands or detailed help for a specific command.',
  details: 'Use `*help` to see a summary of all commands.\nUse `*help <command_name>` to see detailed information, usage instructions, and examples for a specific command.',
  usage: '*help [command_name]',
  examples: ['*help', '*help schedule', '*help start', '*help games', '*help delete'],
  execute: async (message: Message, args: string[], client: Client) => {
    // Check if a specific command was requested
    const commandName = args[0]?.toLowerCase();

    if (commandName) {
      const cmd = commands.get(commandName);
      if (!cmd) {
        await message.reply(`Command \`*${commandName}\` not found.`);
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Command: *${cmd.name}`)
        .setDescription(cmd.details || cmd.description);

      if (cmd.usage) {
        embed.addFields({ name: 'Usage', value: `\`${cmd.usage}\`` });
      }

      if (cmd.examples && cmd.examples.length > 0) {
        embed.addFields({ name: 'Examples', value: cmd.examples.map(e => `\`${e}\``).join('\n') });
      }

      await message.reply({ embeds: [embed] });
    } else {
      // List all commands
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Blade Bot Commands')
        .setDescription('Here are the available commands. Use `*help <command>` for more details.');

      // Get all command names, sort them alphabetically
      const sortedCommandNames = Array.from(commands.keys()).sort();

      sortedCommandNames.forEach((commandName) => {
        const cmd = commands.get(commandName);
        if (cmd) {
          let description = cmd.description;
          // Add "(jask only)" for owner-restricted commands
          if (cmd.name === 'draft' || cmd.name === 'clear' || cmd.name === 'servers') {
            description += ' (jask only)';
          }
          embed.addFields({ name: `*${cmd.name}`, value: description });
        }
      });

      await message.reply({ embeds: [embed] });
    }
  },
};
