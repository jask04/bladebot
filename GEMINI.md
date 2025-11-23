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
- **Database:** SQLite (via `better-sqlite3` or `prisma`) or JSON file for simple persistence of scheduled games (SQLite preferred for robustness).
- **Draft Automation:** Puppeteer for `draftlol.dawe.gg` automation.

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
- [ ] Final testing and deployment instructions.

## Technical Insights & Tips for Gemini

### Agent Tips
- **Regular Updates:** Always update this file with new technical discoveries, architectural decisions, or "gotchas" encountered during development.
- **Environment:** The bot is running on Windows.
- **Persistence:** SQLite (`better-sqlite3`) is the chosen database.

### DraftLol Automation (`draftlol.dawe.gg`)
- **Method:** Puppeteer (headless browser).
- **Button Selector:** The "Create Room" button is best found by text content ("Create") on `button`, `a`, or `div` elements, as standard selectors are brittle.
- **Link Extraction:**
    - The site generates 3 links (Blue, Red, Spectator).
    - These are found in `input[type="text"]` fields.
    - **Order:** Input[0] is Blue, Input[1] is Red, Input[2] is Spectator.
    - **URL Validation:** The URL changes from `https://draftlol.dawe.gg/` to `https://draftlol.dawe.gg/ID/...` upon room creation.

## Current State
- Basic Bot structure operational.
- `*help`, `*draft`, and `*clear` commands implemented and verified.
- Draft generation is fully functional using Puppeteer.
- **Next Focus:** Phase 2 (Scheduling System).