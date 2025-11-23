# Blade Bot Project Plan

## Objective
Create a Discord bot "Blade Bot" for the "blade*" server to manage League of Legends custom games (ARAM and Summoner's Rift).

## Core Features
1.  **Game Scheduling:**
    - Users can schedule games for specific times.
    - Opt-in system via emoji reactions.
    - Thresholds: 4 players for ARAM, 10 for Summoner's Rift.
    - Alerts/Reminders approaching game time.

2.  **Team Management:**
    - **Random:** Randomly assign opted-in players to Team 1 and Team 2.
    - **Captains:** Vote for 2 captains who will then draft players.

3.  **Draft Integration (Summoner's Rift):**
    - Automate creation of draft lobbies on `https://draftlol.dawe.gg/`.
    - Distribute "Blue Team", "Red Team", and "Spectator" links to the respective captains and channel.

## Tech Stack
- **Language:** TypeScript (Node.js)
- **Library:** discord.js
- **Database:** SQLite (via `better-sqlite3`) for persistence.
- **Draft Automation:** Puppeteer for `draftlol.dawe.gg` automation.
- **Deployment:** Docker (Fly.io) with persistent volume.

## Implementation Phases

### Phase 1: Setup & Basic Bot
- [x] Initialize Project & Git Repository.
- [x] specific `GEMINI.md` context setup.
- [x] Bot configuration (Token, App ID).
- [x] Implement Text Command Handler (Prefix: `*`).
- [x] Create `*help` command.
- [x] **Action:** User to invite bot to server using OAuth2 URL.
- [x] Verify `*help` command in Discord (Bot launched).

### Phase 2: Scheduling System
- [x] Command: `/schedule <type> <time>` (e.g., `/schedule type:aram time:20:00`).
- [x] Embed message creation with opt-in reactions.
- [x] Tracking opt-ins.
- [x] Confirmation message when player count reached.

### Phase 3: Team Generation
- [x] Logic for Random team sorting.
- [x] Logic for Captain voting (maybe a pre-game phase where users vote).

### Phase 4: Draft Integration
- [x] Research `draftlol.dawe.gg` automation.
- [x] Implement automation to generate links (Puppeteer).
- [x] Command/Trigger to start the draft process (`*draft`).

### Phase 5: Alerts & Polish
- [ ] Cron jobs or `setTimeout` for reminders (1 hour before, 15 mins before).
- [x] Deployment Setup (Docker/Fly.io).
- [x] Final testing and verification of all core features.

## Technical Insights & Tips for Gemini

### Agent Tips
- **Regular Updates:** Always update this file with new technical discoveries, architectural decisions, or "gotchas" encountered during development.
- **Commit Strategy:** Commit and push code to GitHub after every significant feature or fix.
- **Environment:** Development on Windows. Production on Linux (Docker).

### Deployment (Fly.io)
- **Database Path:** Uses `DB_PATH` environment variable to point to `/data/bladebot.db`.
- **Persistent Volume:** Requires a persistent volume mounted at `/data` (e.g., named `bladebot_data`).
- **Process Command:** `fly.toml` process command must be `npm start`. Avoid auto-generated `dbsetup.js` commands.
- **Puppeteer Setup:** The Dockerfile installs `google-chrome-stable` and sets `PUPPETEER_EXECUTABLE_PATH`.
- **Machine Resources (Crucial for Puppeteer):** For reliable Puppeteer operation, ensure the Fly.io machine has sufficient resources. `shared-cpu-2x` with `2GB` RAM or more is recommended for performance and stability, as `shared-cpu-1x` with `1GB` RAM can lead to `TimeoutError` issues.
- **Manual Scaling:** To suspend the bot, use `fly scale count 0 --app <your-app-name>`. To resume, use `fly scale count 1 --app <your-app-name>`.

### Troubleshooting
- **SQL Errors (`no such column: "..."`):** Ensure string literals in SQL queries are enclosed in single quotes (e.g., `status = 'scheduled'`), not double quotes (which are for identifiers).
- **Timezone Parsing (`*schedule` command):** The bot uses the `DEFAULT_TIMEZONE` environment variable (e.g., `America/Los_Angeles`) for `luxon` to interpret time correctly. Without this, time is parsed in the server's UTC timezone, which can lead to "next day" scheduling.
- **Puppeteer TimeoutErrors:** These often indicate insufficient machine resources or network slowness. Increasing Fly.io machine size (CPU/RAM) and ensuring robust `page.goto` and `waitForSelector` timeouts are critical. Adding a small `await new Promise(r => setTimeout(r, ms));` after `page.newPage()` can sometimes help.
- **GitHub Actions (`flyctl: command not found`):** If using a manual `flyctl` install, ensure the `flyctl` binary is called with its full path (e.g., `/home/runner/.fly/bin/flyctl`) in the workflow file.
- **`DeprecationWarning: The ready event...`**: Update `client.once('ready', ...)` to `client.once('clientReady', ...)`.
- **`ERROR error umounting /data: EBUSY`**: A non-critical warning during machine shutdown for apps with open files on persistent volumes.

### DraftLol Automation (`draftlol.dawe.gg`)
- **Method:** Puppeteer (headless browser).
- **Button Selector:** "Create" button is found by text content on `button`, `a`, or `div`.
- **Link Extraction:** Input[0] is Blue, Input[1] is Red, Input[2] is Spectator.
- **URL Validation:** URL changes from base to `.../ID/...` upon room creation.

## Current State
- All core features (Scheduling, Drafting, Teams) implemented and verified.
- Fully deployed on Fly.io with GitHub Actions for CI/CD.
- **Next Focus:** Final testing and ongoing maintenance.
