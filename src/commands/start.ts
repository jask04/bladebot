import { Message, Client, TextChannel } from 'discord.js';
import { Command } from './command.interface';
import { db } from '../db/database';
import { TeamService } from '../services/team-service';

export const startCommand: Command = {
  name: 'start',
  description: 'Starts the scheduled game immediately if there are enough players (Min 4 for ARAM, exactly 10 for SR). Only the creator can use this.',
  details: `Starts the game associated with the replied message immediately.
  
**Requirements:**
- **ARAM:** Minimum 4 players. Teams are balanced automatically if uneven.
- **Summoner's Rift:** Exactly 10 players.
- **Creator Only:** Only the user who scheduled the game can start it.

**Process:**
- Verifies player count.
- Generates teams based on the selected method (Random or Captains).
- For Summoner's Rift, automatically generates a draft lobby link.`,
  usage: '*start (Reply to the game message)',
  examples: ['*start'],
  execute: async (message: Message, args: string[], client: Client) => {
    if (!message.reference || !message.reference.messageId) {
      await message.reply('Please reply to the game schedule message to start it.');
      return;
    }

    const targetMessageId = message.reference.messageId;
    const gameStmt = db.prepare('SELECT * FROM games WHERE message_id = ?');
    const game = gameStmt.get(targetMessageId) as any;

    if (!game) {
      await message.reply('Could not find a game associated with that message.');
      return;
    }

    // Verify creator (unless default '0' from migration which means unknown)
    if (game.creator_id !== '0' && game.creator_id !== message.author.id) {
        await message.reply('Only the person who scheduled this game can start it.');
        return;
    }

    const signupsStmt = db.prepare('SELECT COUNT(*) as count FROM signups WHERE game_id = ?');
    const result = signupsStmt.get(game.id) as any;
    const playerCount = result.count;
    
    // Validate player counts based on game type
    const isSR = game.type.toLowerCase() === 'sr' || game.type.toLowerCase() === 'rift';
    const isARAM = game.type.toLowerCase() === 'aram';

    if (isSR) {
        if (playerCount !== 10) {
            await message.reply(`Summoner's Rift games require exactly 10 players. Current: ${playerCount}.`);
            return;
        }
    } else if (isARAM) {
        if (playerCount < 4) {
             await message.reply(`ARAM games require at least 4 players. Current: ${playerCount}.`);
             return;
        }
    } else {
        // Fallback for unknown types
        if (playerCount < 4) {
            await message.reply(`Not enough players to start (Minimum 4). Current: ${playerCount}.`);
            return;
        }
    }

    await message.reply(`Game started by <@${message.author.id}>! Generating teams...`);

    if (message.channel instanceof TextChannel) {
        await TeamService.generateTeams(game.id, message.channel);
    }
  },
};
