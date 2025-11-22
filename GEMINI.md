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
    - Automate creation of draft lobbies on `https://draftlol.dawe.gg/` (or similar).
    - Distribute "Blue Team", "Red Team", and "Spectator" links to the respective captains and channel.

## Tech Stack
- **Language:** TypeScript (Node.js)
- **Library:** discord.js
- **Database:** SQLite (via `better-sqlite3` or `prisma`) or JSON file for simple persistence of scheduled games (SQLite preferred for robustness).
- **Draft Automation:** HTTP requests (if API found) or Puppeteer/Playwright for `draftlol.dawe.gg` automation.

## Implementation Phases

### Phase 1: Setup & Basic Bot
- [x] Initialize Project & Git Repository.
- [x] specific `GEMINI.md` context setup.
- [x] Bot configuration (Token, App ID).
- [ ] Basic "Ping/Pong" command to verify connectivity.
- [ ] Implement Text Command Handler (Prefix: `*`).
- [ ] Create `*help` command.

### Phase 2: Scheduling System
- [ ] Command: `/schedule <type> <time>` (e.g., `/schedule type:aram time:20:00`).
- [ ] Embed message creation with opt-in reactions.
- [ ] Tracking opt-ins.
- [ ] Confirmation message when player count reached.

### Phase 3: Team Generation
- [ ] Logic for Random team sorting.
- [ ] Logic for Captain voting (maybe a pre-game phase where users vote).

### Phase 4: Draft Integration
- [ ] Research `draftlol.dawe.gg` "create room" request structure.
- [ ] Implement automation to generate links.
- [ ] Command/Trigger to start the draft process.

### Phase 5: Alerts & Polish
- [ ] Cron jobs or `setTimeout` for reminders (1 hour before, 15 mins before).
- [ ] Final testing and deployment instructions.

## Questions / Clarifications
- **ARAM Count:** User confirmed custom games on Howling Abyss (2v2, 3v3, 4v4, or 5v5). Minimum threshold set to 4 players.
- **Draft Tool:** `draftlol.dawe.gg` seems to not have a public API. We will attempt to reverse engineer the creation request or use a headless browser.
- **Hosting:** Where will this bot run? (Assuming local for now).

## Current State
- Project Initialized.
- `GEMINI.md` created.
- Basic Bot structure (TS, discord.js) set up.
- Waiting for Discord Token.
