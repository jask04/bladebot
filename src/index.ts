import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config } from './config';
import { commands } from './core/command-registry';
import { helpCommand } from './commands/help';
import { scheduleCommand } from './commands/schedule';
import { startCommand } from './commands/start';
import { gamesCommand } from './commands/games';
import { deleteCommand } from './commands/delete';
import { draftCommand } from './commands/draft';
import { clearCommand } from './commands/clear';
import { initDatabase } from './db/database';
// ...
commands.set(draftCommand.name, draftCommand);
commands.set(clearCommand.name, clearCommand);
import { handleReactionAdd, handleReactionRemove } from './events/reaction';
import { Scheduler } from './core/scheduler';

// Initialize Database
initDatabase();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Register Commands
commands.set(helpCommand.name, helpCommand);
commands.set(scheduleCommand.name, scheduleCommand);
commands.set(startCommand.name, startCommand);
commands.set(gamesCommand.name, gamesCommand);
commands.set(deleteCommand.name, deleteCommand);
commands.set(draftCommand.name, draftCommand);

let scheduler: Scheduler;

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  console.log(`Bot is ready to receive commands with prefix '*'`);
  
  // Start Scheduler
  scheduler = new Scheduler(client);
  scheduler.start();
});

client.on('messageReactionAdd', async (reaction, user) => {
  await handleReactionAdd(reaction, user);
});

client.on('messageReactionRemove', async (reaction, user) => {
  await handleReactionRemove(reaction, user);
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