import { Message, Client, PermissionsBitField } from 'discord.js';
import { Command } from './command.interface';
import { db } from '../db/database';

export const clearCommand: Command = {
  name: 'clear',
  description: 'Deletes all scheduled games from the database.',
  details: 'Wipes the entire "games" and "signups" tables in the database. This removes all history and active schedules.\n\n**(Admin Only):** This command requires Administrator permissions.',
  usage: '*clear',
  examples: ['*clear'],
  execute: async (message: Message, args: string[], client: Client) => {
    // Permission check
    if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await message.reply('You need Administrator permissions to use this command.');
      return;
    }

    try {
      const deleteSignups = db.prepare('DELETE FROM signups');
      const deleteGames = db.prepare('DELETE FROM games');

      const signupsResult = deleteSignups.run();
      const gamesResult = deleteGames.run();

      console.log(`Cleared database: Deleted ${gamesResult.changes} games and ${signupsResult.changes} signups.`);
      
      await message.reply(`**Database Cleared.**\nRemoved ${gamesResult.changes} games and ${signupsResult.changes} signups.`);
    } catch (error) {
      console.error('Error clearing database:', error);
      await message.reply('An error occurred while clearing the database.');
    }
  },
};
