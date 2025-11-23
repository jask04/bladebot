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
- [ ] Final testing and deployment instructions.

## Technical Insights & Tips for Gemini

### Agent Tips
- **Regular Updates:** Always update this file with new technical discoveries, architectural decisions, or "gotchas" encountered during development.
- **Commit Strategy:** Commit and push code to GitHub after every significant feature or fix.
- **Environment:** Development on Windows. Production on Linux (Docker).

### Deployment (Fly.io)
- **Database:** Uses `DB_PATH` environment variable to point to `/data/bladebot.db`.
- **Volume:** Requires a persistent volume mounted at `/data`. The volume name in `fly.toml` (source) must match the created volume (e.g., `data` or `bladebot_data`).
- **Process:** Ensure `fly.toml` process command is simply `npm start`. Remove auto-generated `dbsetup.js` commands.
- **Puppeteer:** The Dockerfile installs `google-chrome-stable` and sets `PUPPETEER_EXECUTABLE_PATH`.

### DraftLol Automation (`draftlol.dawe.gg`)
- **Method:** Puppeteer (headless browser).
- **Button Selector:** The "Create Room" button is best found by text content ("Create") on `button`, `a`, or `div` elements, as standard selectors are brittle.
- **Link Extraction:**
    - The site generates 3 links (Blue, Red, Spectator).
    - These are found in `input[type="text"]` fields.
    - **Order:** Input[0] is Blue, Input[1] is Red, Input[2] is Spectator.
    - **URL Validation:** The URL changes from `https://draftlol.dawe.gg/` to `https://draftlol.dawe.gg/ID/...` upon room creation.

## Current State
- All core features (Scheduling, Drafting, Teams) implemented and verified.
- Dockerfile created for Fly.io deployment.
- **Next Focus:** Final deployment verification.