# Blade Bot

A Discord bot for scheduling League of Legends custom games, specifically designed for the "blade*" server.

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
3.  Configure environment variables in `.env` (DISCORD_TOKEN, CLIENT_ID, OWNER_ID).
4.  Run the bot: `npm start` (or `npm run dev` for development).

## Tech Stack
- Node.js (TypeScript)
- discord.js
- Puppeteer (for draft automation)
- SQLite

## Fly.io Management Commands

This section provides a quick reference for common `flyctl` commands used to manage the Blade Bot deployment on Fly.io.

*   **`fly launch`**: Initializes a new Fly.io app, creates `fly.toml`, and guides through initial setup.
*   **`fly deploy`**: Builds and deploys the bot to Fly.io. Run this after any code changes.
*   **`fly status`**: Shows the current status of your application, including running machines, allocated resources, and recent deployments.
*   **`fly logs -a bladebot`**: Streams logs from your running bot to your terminal. Useful for debugging.
*   **`fly secrets set KEY=VALUE`**: Sets environment variables (secrets) for your application. Example: `fly secrets set DISCORD_TOKEN=your_token CLIENT_ID=your_client_id OWNER_ID=your_user_id`.
*   **`fly volumes list`**: Lists all persistent volumes associated with your Fly.io account.
*   **`fly volumes create <name> --size 1 --region <region>`**: Creates a new persistent volume. Replace `<name>` and `<region>`. Example: `fly volumes create bladebot_data --size 1 --region sjc`.
*   **`fly volumes delete <name>`**: Deletes a persistent volume. Use with caution.
*   **`fly scale count <number> --app bladebot`**: Manually scales your bot's machines up or down.
    *   `fly scale count 0 --app bladebot`: Stops the bot (suspends it).
    *   `fly scale count 1 --app bladebot`: Starts the bot.
*   **`fly ssh console`**: Provides an SSH connection to your running machine, allowing you to debug inside the container.
*   **`fly apps destroy bladebot`**: **Deletes your entire Fly.io application**, including all machines and volumes. **Use with extreme caution!**

Remember to replace `bladebot` with your actual app name if you chose a different one.