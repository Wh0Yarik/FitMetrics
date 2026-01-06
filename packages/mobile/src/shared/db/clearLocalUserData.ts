import * as SQLite from 'expo-sqlite';

const DB_NAME = 'fitmetrics.db';

export const clearLocalUserData = () => {
  const db = SQLite.openDatabaseSync(DB_NAME);
  const tables = ['meal_entries', 'daily_surveys', 'measurements'];

  tables.forEach((table) => {
    try {
      db.runSync(`DELETE FROM ${table}`);
    } catch (error) {
      // Table may not exist yet on fresh installs.
      console.warn(`Failed to clear ${table}:`, error);
    }
  });
};
