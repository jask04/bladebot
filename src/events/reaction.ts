import { MessageReaction, User, PartialMessageReaction, PartialUser, EmbedBuilder, Message, TextChannel } from 'discord.js';
import { db } from '../db/database';

export async function handleReactionAdd(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
  if (user.bot) return;
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message:', error);
      return;
    }
  }
  if (reaction.emoji.name !== '👍') return;

  const messageId = reaction.message.id;
  const stmt = db.prepare('SELECT * FROM games WHERE message_id = ?');
  const game = stmt.get(messageId) as any;

  if (!game) return;

  // Add to signups
  try {
    const insert = db.prepare('INSERT INTO signups (game_id, user_id, username) VALUES (?, ?, ?)');
    insert.run(game.id, user.id, user.username || 'Unknown');
    console.log(`User ${user.username} signed up for game ${game.id}`);
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      // Already signed up, ignore
      return;
    }
    console.error('Error adding signup:', err);
  }

  // Update count
  await updateGameEmbed(reaction.message as Message, game.id, game.type);
}

export async function handleReactionRemove(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    if (user.bot) return;
     if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return;
        }
    }
    if (reaction.emoji.name !== '👍') return;

    const messageId = reaction.message.id;
    const stmt = db.prepare('SELECT * FROM games WHERE message_id = ?');
    const game = stmt.get(messageId) as any;

    if (!game) return;

    // Remove from signups
    const del = db.prepare('DELETE FROM signups WHERE game_id = ? AND user_id = ?');
    del.run(game.id, user.id);
    console.log(`User ${user.username} removed from game ${game.id}`);

    // Update count
    await updateGameEmbed(reaction.message as Message, game.id, game.type);
}

async function updateGameEmbed(message: Message, gameId: number, gameType: string) {
    // Get count and player names
    const signupsStmt = db.prepare('SELECT user_id, username FROM signups WHERE game_id = ?');
    const signups = signupsStmt.all(gameId) as { user_id: string, username: string }[];
    const count = signups.length;
    const playerList = signups.map(s => `<@${s.user_id}>`).join('\n') || 'No players yet.'; // Using mentions

    // Get Embed
    const oldEmbed = message.embeds[0];
    if (!oldEmbed) return;

    const newEmbed = EmbedBuilder.from(oldEmbed);
    let fields = newEmbed.data.fields || [];

    // Find and update 'Players Joined' field
    const countFieldIndex = fields.findIndex(f => f.name === 'Players Joined');
    if (countFieldIndex !== -1 && fields[countFieldIndex]) {
        fields[countFieldIndex].value = count.toString();
    } else {
        // Add if not found (should be there from initial creation)
        fields.push({ name: 'Players Joined', value: count.toString(), inline: true });
    }

    // Find and update/add 'Players' field
    const playersFieldIndex = fields.findIndex(f => f.name === 'Players');
    if (playersFieldIndex !== -1 && fields[playersFieldIndex]) {
        fields[playersFieldIndex].value = playerList;
    } else {
        fields.push({ name: 'Players', value: playerList, inline: false }); // Not inline, takes full width
    }

    newEmbed.setFields(fields);

    await message.edit({ embeds: [newEmbed] });

    // Check Threshold
    const threshold = gameType === 'aram' ? 4 : 10;
    if (count === threshold) {
         if (message.channel instanceof TextChannel) {
            await message.channel.send(`@here ${gameType.toUpperCase()} Game is ready! ${count} players have joined.`);
         }
    }
}