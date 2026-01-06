import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { getCurrentUserIdSync } from '../../../shared/db/userSession';

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
        user_id TEXT,
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

    const updatedColumns = this.db.getAllSync<any>('PRAGMA table_info(meal_entries)');
    const updatedNames = updatedColumns.map((c) => c.name);
    if (!updatedNames.includes('user_id')) {
      this.db.execSync('ALTER TABLE meal_entries ADD COLUMN user_id TEXT');
    }
  }

  getMealsByDate(date: string): MealEntry[] {
    const userId = getCurrentUserIdSync();
    if (!userId) return [];
    const rows = this.db.getAllSync<any>(
      'SELECT * FROM meal_entries WHERE date = ? AND user_id = ? ORDER BY time ASC',
      [date, userId]
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
    const userId = getCurrentUserIdSync();
    if (!userId) {
      console.warn('addMeal skipped: no user id');
      return;
    }
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    
    this.db.runSync(
      `INSERT INTO meal_entries (id, user_id, date, name, time, protein, fat, carbs, fiber, synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        userId,
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
    const userId = getCurrentUserIdSync();
    if (!userId) return;
    this.db.runSync('DELETE FROM meal_entries WHERE id = ? AND user_id = ?', [id, userId]);
  }

  updateMeal(id: string, name: string, portions: PortionCount): void {
    const userId = getCurrentUserIdSync();
    if (!userId) {
      console.warn('updateMeal skipped: no user id');
      return;
    }
    const now = new Date().toISOString();
    this.db.runSync(
      `UPDATE meal_entries 
       SET name = ?, protein = ?, fat = ?, carbs = ?, fiber = ?, synced = 0, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        name,
        portions.protein,
        portions.fat,
        portions.carbs,
        portions.fiber,
        now,
        id,
        userId,
      ]
    );
  }

  hasUnsyncedMeals(date: string): boolean {
    const userId = getCurrentUserIdSync();
    if (!userId) return false;
    const row = this.db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM meal_entries WHERE date = ? AND user_id = ? AND synced = 0',
      [date, userId]
    );
    return (row?.count ?? 0) > 0;
  }

  markMealsAsSynced(date: string): void {
    const userId = getCurrentUserIdSync();
    if (!userId) return;
    const now = new Date().toISOString();
    this.db.runSync(
      'UPDATE meal_entries SET synced = 1, updated_at = ? WHERE date = ? AND user_id = ?',
      [now, date, userId]
    );
  }

  replaceMealsFromServer(
    date: string,
    meals: Array<{ name: string; time?: string | null; protein: number; fat: number; carbs: number; fiber: number }>
  ): void {
    const userId = getCurrentUserIdSync();
    if (!userId) return;
    const now = new Date().toISOString();
    this.db.runSync('DELETE FROM meal_entries WHERE date = ? AND user_id = ?', [date, userId]);
    meals.forEach((meal) => {
      const id = Crypto.randomUUID();
      const time = meal.time ?? now;
      this.db.runSync(
        `INSERT INTO meal_entries (id, user_id, date, name, time, protein, fat, carbs, fiber, synced, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          id,
          userId,
          date,
          meal.name,
          time,
          meal.protein,
          meal.fat,
          meal.carbs,
          meal.fiber,
          now,
          now,
        ]
      );
    });
  }

  // Получить список дат с записями о еде за месяц
  getDatesWithMeals(year: string, month: string): string[] {
    const userId = getCurrentUserIdSync();
    if (!userId) return [];
    const pattern = `${year}-${month}-%`;
    const rows = this.db.getAllSync<{ date: string }>(
      'SELECT DISTINCT date FROM meal_entries WHERE date LIKE ? AND user_id = ?',
      [pattern, userId]
    );
    return rows.map(r => r.date);
  }
}

export const diaryRepository = new DiaryRepository();
