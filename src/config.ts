import dotenv from 'dotenv';

dotenv.config();

export const config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
  CLIENT_ID: process.env.CLIENT_ID || '',
  GUILD_ID: process.env.GUILD_ID || '',
  OWNER_ID: process.env.OWNER_ID || '',
  DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || 'UTC',
};

if (!config.DISCORD_TOKEN) {
  console.warn('DISCORD_TOKEN is not defined in .env');
}
