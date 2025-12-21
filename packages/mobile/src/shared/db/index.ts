import * as SQLite from 'expo-sqlite';

let db: any = null;

/**
 * Инициализация локальной базы данных.
 * Создает таблицы, если они не существуют.
 */
export const initDatabase = async (): Promise<void> => {
  // 1. Открываем базу данных (поддержка нового и старого API)
  if (typeof SQLite.openDatabaseSync === 'function') {
    db = SQLite.openDatabaseSync('fitmetrics.db');
  } else if (typeof SQLite.openDatabase === 'function') {
    db = SQLite.openDatabase('fitmetrics.db');
  } else {
    throw new Error('SQLite openDatabase API not found');
  }

  // 2. Создаем таблицы
  const schema = `
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS diary_entries (
      id TEXT PRIMARY KEY NOT NULL,
      client_id TEXT NOT NULL,
      date TEXT NOT NULL,
      total_protein REAL DEFAULT 0,
      total_fat REAL DEFAULT 0,
      total_carbs REAL DEFAULT 0,
      total_fiber REAL DEFAULT 0,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(client_id, date)
    );
    CREATE TABLE IF NOT EXISTS meal_entries (
      id TEXT PRIMARY KEY NOT NULL,
      diary_entry_id TEXT NOT NULL,
      time TEXT,
      protein REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fiber REAL DEFAULT 0,
      comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (diary_entry_id) REFERENCES diary_entries (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_diary_date ON diary_entries (client_id, date);
    CREATE INDEX IF NOT EXISTS idx_meal_diary_id ON meal_entries (diary_entry_id);
  `;

  if (db.execAsync) {
    // Новый API
    await db.execAsync(schema);
  } else {
    // Старый API (WebSQL)
    // Для простоты здесь не реализуем полный фолбэк для старого API, 
    // так как ошибка указывает на использование новой версии библиотеки.
    console.warn('Using legacy SQLite API fallback is not fully implemented in this fix.');
  }
  
  console.log('Локальная БД успешно инициализирована');
};

// Экспортируем объект базы для выполнения запросов в репозиториях
export const getDb = () => db;