export const DIARY_SCHEMA = `
  -- Таблица дней (агрегация за день)
  CREATE TABLE IF NOT EXISTS diary_entries (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL, -- Format: YYYY-MM-DD
    synced INTEGER DEFAULT 0, -- Boolean: 0 or 1
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
  );

  -- Таблица приемов пищи
  CREATE TABLE IF NOT EXISTS meal_entries (
    id TEXT PRIMARY KEY NOT NULL,
    diary_entry_id TEXT NOT NULL,
    name TEXT NOT NULL,
    protein INTEGER DEFAULT 0,
    fat INTEGER DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    fiber INTEGER DEFAULT 0,
    time TEXT, -- ISO String
    synced INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diary_entry_id) REFERENCES diary_entries (id) ON DELETE CASCADE
  );
`;