import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from './command.interface';
import { db } from '../db/database';

export const deleteCommand: Command = {
  name: 'delete',
  description: 'Cancels a scheduled game. Only the creator can use this.',
  details: 'Cancels the game associated with the replied message. Updates the database status to "cancelled" and edits the original signup message to reflect the cancellation.\n\n**Permissions:**\n- Only the game creator (or an Admin) can delete a game.',
  usage: '*delete (Reply to the game message)',
  examples: ['*delete'],
  execute: async (message: Message, args: string[], client: Client) => {
    // 1. Check for reply
    if (!message.reference || !message.reference.messageId) {
      await message.reply('Please reply to the game schedule message you want to delete.');
      return;
    }

    const targetMessageId = message.reference.messageId;

    // 2. Fetch game
    const gameStmt = db.prepare('SELECT * FROM games WHERE message_id = ?');
    const game = gameStmt.get(targetMessageId) as any;

    if (!game) {
      await message.reply('Could not find a game associated with that message.');
      console.error(`[Delete Error] No game found for message ID ${targetMessageId}`);
      return;
    }

    // 3. Check Authorization
    if (game.creator_id !== message.author.id) {
        const member = message.guild?.members.cache.get(message.author.id);
        const isAdmin = member?.permissions.has('Administrator');

        if (!isAdmin) {
             await message.reply('Only the person who scheduled this game (or an Admin) can delete it.');
             console.error(`[Delete Error] Unauthorized attempt to delete game ${game.id} by user ${message.author.id}`);
             return;
        }
    }

    // 4. "Delete" (Cancel) the game
    try {
        db.prepare("UPDATE games SET status = 'cancelled' WHERE id = ?").run(game.id);
    } catch (dbError) {
        console.error(`[Delete Error] Database update failed for game ${game.id}:`, dbError);
        await message.reply('An error occurred while updating the game status in the database.');
        return;
    }

    // 5. Update the original message to reflect cancellation
    try {
        const channel = await client.channels.fetch(game.channel_id);
        if (channel && channel.isTextBased()) {
            const originalMessage = await channel.messages.fetch(game.message_id);
            if (originalMessage) {
                const oldEmbed = originalMessage.embeds[0];
                if (oldEmbed) {
                    const newEmbed = EmbedBuilder.from(oldEmbed)
                        .setTitle(`❌ [CANCELLED] ${oldEmbed.title}`)
                        .setColor('#FF0000')
                        .setDescription('This game has been cancelled by the host.');
                    
                    await originalMessage.edit({ embeds: [newEmbed] });
                } else {
                    console.warn(`[Delete Warning] Original message ${game.message_id} has no embed to update.`);
                }
            } else {
                console.warn(`[Delete Warning] Original message ${game.message_id} not found.`);
            }
        } else {
            console.warn(`[Delete Warning] Channel ${game.channel_id} is not text-based or not found.`);
        }
    } catch (e) {
        console.error('Failed to update original message during deletion:', e);
        // Continue, as DB is updated.
    }

    await message.reply(`Game scheduled for <t:${Math.floor(new Date(game.scheduled_time).getTime() / 1000)}:F> has been cancelled.`);
  },
};
