import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from './command.interface';
import { db } from '../db/database';
import { DateTime } from 'luxon';

export const gamesCommand: Command = {
  name: 'games',
  description: 'Lists all currently scheduled games.',
  details: 'Displays a list of all games with status "scheduled". Includes the game type, scheduled time (relative), current player count, and a link to jump directly to the signup message.',
  usage: '*games',
  examples: ['*games'],
  execute: async (message: Message, args: string[], client: Client) => {
    const gamesStmt = db.prepare("SELECT * FROM games WHERE status = 'scheduled' ORDER BY scheduled_time ASC");
    const games = gamesStmt.all() as any[];

    if (games.length === 0) {
      await message.reply('No games are currently scheduled.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📅 Upcoming Games')
      .setDescription('Click the link to jump to the sign-up message.');

    for (const game of games) {
      // Get player count
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM signups WHERE game_id = ?');
      const result = countStmt.get(game.id) as any;
      const count = result.count;

      const time = DateTime.fromISO(game.scheduled_time);
      let timestamp = Math.floor(time.toSeconds());
      
      if (isNaN(timestamp)) {
          console.error(`Invalid time for game ${game.id}: ${game.scheduled_time}`);
          timestamp = 0; // Fallback or skip
      }

      // Construct Message Link
      // https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID
      const guildId = message.guildId || '@me'; // Fallback for DMs
      const link = `https://discord.com/channels/${guildId}/${game.channel_id}/${game.message_id}`;

      embed.addFields({
        name: `${game.type.toUpperCase()} - <t:${timestamp}:t> (<t:${timestamp}:R>)`,
        value: `Players: **${count}**\n[Jump to Sign-up](${link})`,
        inline: false
      });
    }

    await message.reply({ embeds: [embed] });
  },
};
