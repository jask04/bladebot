# blade bot

A Discord bot for scheduling League of Legends custom games

## Features
- **Game Scheduling:** Organize custom ARAM or Summoner's Rift matches.
- **Team Management:** Randomly assign teams or facilitate captain drafts.
- **Draft Automation:** Automatically generates [draftlol.dawe.gg](https://draftlol.dawe.gg/) lobbies for Summoner's Rift games.

## Commands
- `*help`: Displays a list of available commands.
- `*draft`: Automatically generates a new draft lobby on draftlol.dawe.gg and returns the Blue, Red, and Spectator links.
- `*clear`: Deletes all scheduled games from the database.

## Setup
1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  Configure environment variables in `.env` (DISCORD_TOKEN, CLIENT_ID).
4.  Run the bot: `npm start` (or `npm run dev` for development).

## Tech Stack
- Node.js (TypeScript)
- discord.js
- Puppeteer (for draft automation)
- SQLite