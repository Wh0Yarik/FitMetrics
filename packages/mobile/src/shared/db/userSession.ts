import * as SQLite from 'expo-sqlite';

const DB_NAME = 'fitmetrics.db';
const USER_KEY = 'user_id';

let cachedUserId: string | null = null;

const getDb = () => SQLite.openDatabaseSync(DB_NAME);

const ensureStateTable = () => {
  const db = getDb();
  db.execSync(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);
  return db;
};

export const setCurrentUserId = (userId: string | null) => {
  const db = ensureStateTable();
  cachedUserId = userId ?? null;

  if (userId) {
    db.runSync(
      `INSERT INTO app_state (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [USER_KEY, userId]
    );
  } else {
    db.runSync('DELETE FROM app_state WHERE key = ?', [USER_KEY]);
  }
};

export const getCurrentUserIdSync = (): string | null => {
  if (cachedUserId) return cachedUserId;
  const db = ensureStateTable();
  const row = db.getFirstSync<{ value: string }>(
    'SELECT value FROM app_state WHERE key = ?',
    [USER_KEY]
  );
  cachedUserId = row?.value ?? null;
  return cachedUserId;
};
