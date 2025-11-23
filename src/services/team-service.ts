import { EmbedBuilder, TextChannel, Message } from 'discord.js';
import { db } from '../db/database';
import { DraftService } from './draft-service';

export class TeamService {
  private static readonly EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  static async generateTeams(gameId: number, channel: TextChannel) {
    const gameStmt = db.prepare('SELECT * FROM games WHERE id = ?');
    const game = gameStmt.get(gameId) as any;

    if (!game) return;

    if (game.generation_method === 'random') {
      await this.generateRandomTeams(game, channel);
    } else if (game.generation_method === 'captains') {
      await this.startCaptainVoting(game, channel);
    }

    // Draft Integration for Summoner's Rift
    if (game.type === 'sr' || game.type === 'rift') {
        const loadingMsg = await channel.send('Generating Draft Lobby... ⏳');
        const links = await DraftService.createDraft();
        
        if (links) {
            // If links are identical (fallback), just show one
            if (links.blue === links.red) {
                 await loadingMsg.edit(`**Draft Room Created:**\n${links.blue}\n\n(Please share the respective team links from inside the lobby)`);
            } else {
                await loadingMsg.edit(`**Draft Room Created:**\n\n🔵 **Blue Team:** ||${links.blue}||\n🔴 **Red Team:** ||${links.red}||\n👀 **Spectator:** ${links.spectator}`);
            }
        } else {
            await loadingMsg.edit('Failed to create automated draft lobby. Please create one manually.');
        }
    }
  }

  private static async generateRandomTeams(game: any, channel: TextChannel) {
    const signupsStmt = db.prepare('SELECT * FROM signups WHERE game_id = ?');
    const players = signupsStmt.all(game.id) as any[];

    // Shuffle
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const mid = Math.ceil(shuffled.length / 2);
    const team1 = shuffled.slice(0, mid);
    const team2 = shuffled.slice(mid);

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`Teams for ${game.type.toUpperCase()} Game`)
      .addFields(
        { name: '🔵 Blue Team', value: team1.map(p => `<@${p.user_id}>`).join('\n') || 'Empty', inline: true },
        { name: '🔴 Red Team', value: team2.map(p => `<@${p.user_id}>`).join('\n') || 'Empty', inline: true }
      );

    await channel.send({ embeds: [embed] });
    
    // Update game status
    db.prepare('UPDATE games SET status = "active" WHERE id = ?').run(game.id);
  }

  private static async startCaptainVoting(game: any, channel: TextChannel) {
    const signupsStmt = db.prepare('SELECT * FROM signups WHERE game_id = ?');
    const players = signupsStmt.all(game.id) as any[];

    if (players.length < 4) {
      await channel.send('Not enough players for captain voting (minimum 4 players required).');
      return;
    }
    if (players.length > this.EMOJIS.length) {
      await channel.send(`Too many players for captain voting (${players.length}). Max supported: ${this.EMOJIS.length}.`);
      return;
    }

    const playerList = players.map((p, index) => `${this.EMOJIS[index]} <@${p.user_id}>`).join('\n');

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('Vote for Captains! 👑')
      .setDescription(`React with the corresponding emoji to vote for two captains from the list below:\n\n${playerList}\n\nVoting ends in 2 minutes.`);
    
    const votingMessage = await channel.send({ embeds: [embed] });

    for (let i = 0; i < players.length; i++) {
      await votingMessage.react(this.EMOJIS[i]!);
    }

    const filter = (reaction: any, user: any) => this.EMOJIS.includes(reaction.emoji.name) && !user.bot;

    try {
      const collected = await votingMessage.awaitReactions({ filter, time: 120000, maxUsers: players.length, errors: ['time'] }); // 2 minutes

      const voteCounts = new Map<string, number>(); // player_id -> vote_count
      collected.forEach((reaction) => {
        const emojiIndex = this.EMOJIS.indexOf(reaction.emoji.name!);
        if (emojiIndex !== -1 && players[emojiIndex]) {
          // Iterate through users who reacted to this emoji
          reaction.users.cache.forEach((user: any) => {
            if (!user.bot) {
              const votedPlayerId = players[emojiIndex].user_id;
              voteCounts.set(votedPlayerId, (voteCounts.get(votedPlayerId) || 0) + 1);
            }
          });
        }
      });

      // Sort players by vote count
      const sortedCandidates = Array.from(voteCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([userId]) => userId);

      if (sortedCandidates.length < 2) {
        await channel.send('Not enough votes to elect two captains. Please try again or choose Random Teams.');
        db.prepare('UPDATE games SET status = "failed_captain_vote" WHERE id = ?').run(game.id);
        return;
      }

      const captain1Id = sortedCandidates[0];
      const captain2Id = sortedCandidates[1];

      await channel.send(`Your captains have been elected! 
      Captain 1: <@${captain1Id}>
      Captain 2: <@${captain2Id}>
      They will now pick teams.`); // Placeholder for actual drafting logic

      db.prepare('UPDATE games SET status = "captains_elected" WHERE id = ?').run(game.id);

    } catch (e) {
      await channel.send('Captain voting timed out. Please try again or choose Random Teams.');
      db.prepare('UPDATE games SET status = "failed_captain_vote" WHERE id = ?').run(game.id);
    }
  }
}