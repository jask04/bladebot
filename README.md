# Blade Bot

**Blade Bot** is an open-source Discord bot designed to streamline the organization of League of Legends custom games. It handles scheduling, team generation, and even automates the creation of draft lobbies.

## ✨ Features

*   **📅 Easy Scheduling:** Schedule games for specific times (supports timezones). Users simply react with 👍 to sign up.
*   **⚖️ Team Balancing:**
    *   **Random:** Automatically shuffles players into balanced teams (handles uneven counts like 2v3).
    *   **Captains:** Facilitates a voting phase where players elect two captains to draft teams.
*   **🤖 Automated Drafts:** For Summoner's Rift, the bot uses a headless browser to create a lobby on [draftlol.dawe.gg](https://draftlol.dawe.gg/) and privately distributes Blue/Red/Spectator links.
*   **🛠️ Management Tools:** Commands to view upcoming games, manually start them, or clear the schedule.

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18 or higher)
*   **npm**
*   **Discord Bot Token:** Create one at the [Discord Developer Portal](https://discord.com/developers/applications).
    *   *Intents required:* `Guilds`, `GuildMessages`, `MessageContent`, `GuildMessageReactions`.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/bladebot.git
    cd bladebot
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Copy `.env.example` to `.env` and fill in your details.
    ```bash
    cp .env.example .env
    ```
    *   `DISCORD_TOKEN`: Your bot's token.
    *   `CLIENT_ID`: Your bot's Application ID.
    *   `OWNER_ID`: (Optional) Your user ID for owner-only commands.
    *   `DEFAULT_TIMEZONE`: (Optional) Your local timezone (e.g., `America/Los_Angeles`).

4.  **Run the bot:**
    ```bash
    npm run dev
    ```

## 🐳 Docker Deployment

This project includes a `Dockerfile` optimized for running Puppeteer (Chromium).

1.  **Build the image:**
    ```bash
    docker build -t bladebot .
    ```

2.  **Run the container:**
    ```bash
    docker run -d \
      --env-file .env \
      -v $(pwd)/data:/data \
      bladebot
    ```
    *Note: The `-v` flag mounts a volume for the SQLite database so data persists.*

## ☁️ Deployment on Fly.io

The project is ready for [Fly.io](https://fly.io/).

1.  **Initialize App:**
    ```bash
    fly launch --no-deploy
    ```
    *   Copy the contents of `fly.toml.example` to your new `fly.toml` if needed, ensuring you update the app name.

2.  **Create Volume:**
    ```bash
    fly volumes create bladebot_data --size 1
    ```

3.  **Set Secrets:**
    ```bash
    fly secrets set DISCORD_TOKEN=... CLIENT_ID=... 
    ```

4.  **Deploy:**
    ```bash
    fly deploy
    ```

## 📝 Commands

*   `*schedule <type> <time>`: Schedule a game (Types: `aram`, `sr`).
*   `*start`: Start a scheduled game immediately (Reply to the schedule message).
*   `*games`: List upcoming games.
*   `*delete`: Cancel a game (Reply to the schedule message).
*   `*draft`: Manually generate a draft lobby link (Admin only).
*   `*clear`: Wipe the database (Admin only).
*   `*help`: Show all commands.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
