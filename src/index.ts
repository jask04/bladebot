import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from './config';
import { Command } from './commands/command.interface';
import { helpCommand } from './commands/help';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// Command Collection
export const commands = new Collection<string, Command>();

// Register Commands
commands.set(helpCommand.name, helpCommand);

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  console.log(`Bot is ready to receive commands with prefix '*'`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('*')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  const command = commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    await message.reply('There was an error trying to execute that command!');
  }
});

client.login(config.DISCORD_TOKEN);