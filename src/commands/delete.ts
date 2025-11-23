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
      return;
    }

    // 3. Check Authorization
    // If creator_id is '0' (legacy), maybe allow admin? For now, strict check or allow if user has admin perms?
    // Let's stick to creator check.
    if (game.creator_id !== message.author.id) {
        // Optional: Allow Server Admins to delete any game
        const member = message.guild?.members.cache.get(message.author.id);
        const isAdmin = member?.permissions.has('Administrator');

        if (!isAdmin) {
             await message.reply('Only the person who scheduled this game (or an Admin) can delete it.');
             return;
        }
    }

    // 4. "Delete" (Cancel) the game
    // We set status to 'cancelled' so it doesn't show up in *games or get scheduled.
    db.prepare('UPDATE games SET status = "cancelled" WHERE id = ?').run(game.id);

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
                    // Optional: Remove reactions?
                    // await originalMessage.reactions.removeAll();
                }
            }
        }
    } catch (e) {
        console.error('Failed to update original message during deletion:', e);
        // Continue, as DB is updated.
    }

    await message.reply(`Game scheduled for <t:${Math.floor(new Date(game.scheduled_time).getTime() / 1000)}:F> has been cancelled.`);
  },
};
