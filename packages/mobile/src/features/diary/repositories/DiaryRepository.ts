import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

export interface PortionCount {
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface MealEntry {
  id: string;
  date: string;
  name: string;
  time: string;
  portions: PortionCount;
  synced: boolean;
}

export class DiaryRepository {
  private db: SQLite.SQLiteDatabase;

  constructor(dbName: string = 'fitmetrics.db') {
    this.db = SQLite.openDatabaseSync(dbName);
    this.initTable();
  }

  private initTable() {
    // FIX: Проверяем схему БД. Если старая версия таблицы (без date или synced) — пересоздаем её.
    const columns = this.db.getAllSync<any>('PRAGMA table_info(meal_entries)');
    const columnNames = columns.map(c => c.name);
    const hasDate = columnNames.includes('date');
    const hasSynced = columnNames.includes('synced');
    
    if (columns.length > 0 && (!hasDate || !hasSynced)) {
      this.db.execSync('DROP TABLE IF EXISTS meal_entries');
    }

    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS meal_entries (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        time TEXT NOT NULL,
        protein REAL DEFAULT 0,
        fat REAL DEFAULT 0,
        carbs REAL DEFAULT 0,
        fiber REAL DEFAULT 0,
        synced INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  getMealsByDate(date: string): MealEntry[] {
    const rows = this.db.getAllSync<any>(
      'SELECT * FROM meal_entries WHERE date = ? ORDER BY time ASC',
      [date]
    );

    return rows.map(row => ({
      id: row.id,
      date: row.date,
      name: row.name,
      time: row.time,
      portions: {
        protein: row.protein,
        fat: row.fat,
        carbs: row.carbs,
        fiber: row.fiber
      },
      synced: !!row.synced
    }));
  }

  addMeal(date: string, name: string, portions: PortionCount): void {
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    
    this.db.runSync(
      `INSERT INTO meal_entries (id, date, name, time, protein, fat, carbs, fiber, synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id, 
        date, 
        name, 
        now, // Используем текущее время добавления
        portions.protein, 
        portions.fat, 
        portions.carbs, 
        portions.fiber,
        now,
        now
      ]
    );
  }

  deleteMeal(id: string): void {
    this.db.runSync('DELETE FROM meal_entries WHERE id = ?', [id]);
  }
}

export const diaryRepository = new DiaryRepository();