import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || 'bladebot.db';
const db: Database.Database = new Database(dbPath);

export function initDatabase() {
  const createGamesTable = `
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      creator_id TEXT NOT NULL DEFAULT '0',
      status TEXT DEFAULT 'scheduled',
      generation_method TEXT DEFAULT 'random',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createSignupsTable = `
    CREATE TABLE IF NOT EXISTS signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games (id),
      UNIQUE(game_id, user_id)
    );
  `;

  db.exec(createGamesTable);
  
  // Migrations
  try {
    db.prepare('ALTER TABLE games ADD COLUMN generation_method TEXT DEFAULT "random"').run();
  } catch (error: any) {
    if (!error.message.includes('duplicate column name')) console.error('Migration error:', error);
  }

  try {
    db.prepare('ALTER TABLE games ADD COLUMN creator_id TEXT NOT NULL DEFAULT "0"').run();
  } catch (error: any) {
    if (!error.message.includes('duplicate column name')) console.error('Migration error:', error);
  }

  db.exec(createSignupsTable);
  console.log('Database initialized.');
}

export { db };
