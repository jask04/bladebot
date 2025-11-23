import { Client, TextChannel } from 'discord.js';
import { DateTime } from 'luxon';
import { db } from '../db/database';
import { TeamService } from '../services/team-service';

export class Scheduler {
  private client: Client;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  public start() {
    if (this.intervalId) return;
    // Check every minute
    this.intervalId = setInterval(() => this.checkScheduledGames(), 60 * 1000);
    console.log('Scheduler started.');
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Scheduler stopped.');
    }
  }

  private async checkScheduledGames() {
    const now = DateTime.now().toUTC().toISO(); // Ensure UTC comparison if DB stores ISO strings
    // Actually, our DB stores local ISO time from Luxon. Let's be careful.
    // In schedule.ts: scheduledTime.toISO() -> includes offset.
    // better-sqlite3 / SQLite comparison on ISO strings works if format is consistent.
    // Let's fetch all 'scheduled' games and filter in code to be safe with timezones.
    
    const gamesStmt = db.prepare("SELECT * FROM games WHERE status = 'scheduled'");
    const games = gamesStmt.all() as any[];

    for (const game of games) {
      const scheduledTime = DateTime.fromISO(game.scheduled_time);
      
      if (scheduledTime <= DateTime.now()) {
          // Game is due!
          console.log(`Game ${game.id} is due. Processing...`);
          
          // Check player count
          const signupsStmt = db.prepare('SELECT COUNT(*) as count FROM signups WHERE game_id = ?');
          const result = signupsStmt.get(game.id) as any;
          
          // Min thresholds
          const minPlayers = game.type === 'aram' ? 4 : 10;
          
          try {
            const channel = await this.client.channels.fetch(game.channel_id) as TextChannel;
            if (!channel) {
                console.error(`Channel ${game.channel_id} not found for game ${game.id}`);
                continue;
            }

            if (result.count >= minPlayers) {
                await channel.send(`⏰ **It's time!** The **${game.type.toUpperCase()}** game is starting now with ${result.count} players.`);
                await TeamService.generateTeams(game.id, channel);
            } else {
                await channel.send(`⏰ **It's time**, but not enough players joined (${result.count}/${minPlayers}). Game cancelled.`);
                db.prepare('UPDATE games SET status = "cancelled" WHERE id = ?').run(game.id);
            }

          } catch (error) {
              console.error(`Error processing game ${game.id}:`, error);
          }
      }
    }
  }
}
