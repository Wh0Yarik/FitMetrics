import * as SQLite from 'expo-sqlite';
import { PortionCount } from '../components/AddMealModal';

// Интерфейс записи приема пищи
export interface MealEntry {
  id: string;
  diaryEntryId: string;
  name: string;
  portions: PortionCount;
  time: string;
  synced: boolean;
}

export class DiaryRepository {
  private db: SQLite.SQLiteDatabase;

  constructor(dbName: string = 'fitmetrics.db') {
    this.db = SQLite.openDatabaseSync(dbName);
  }

  // Получить или создать запись дня
  private getOrCreateDiaryEntry(date: string): string {
    const row = this.db.getFirstSync<{ id: string }>(
      'SELECT id FROM diary_entries WHERE date = ?',
      [date]
    );

    if (row) {
      return row.id;
    }

    const newId = crypto.randomUUID();
    this.db.runSync(
      'INSERT INTO diary_entries (id, date, synced) VALUES (?, ?, 0)',
      [newId, date]
    );
    return newId;
  }

  // Добавить прием пищи
  addMeal(date: string, name: string, portions: PortionCount): MealEntry {
    const diaryEntryId = this.getOrCreateDiaryEntry(date);
    const mealId = crypto.randomUUID();
    const time = new Date().toISOString();

    this.db.runSync(
      `INSERT INTO meal_entries (id, diary_entry_id, name, protein, fat, carbs, fiber, time, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        mealId,
        diaryEntryId,
        name,
        portions.protein,
        portions.fat,
        portions.carbs,
        portions.fiber,
        time
      ]
    );

    return {
      id: mealId,
      diaryEntryId,
      name,
      portions,
      time,
      synced: false
    };
  }

  // Получить все приемы пищи за дату
  getMealsByDate(date: string): MealEntry[] {
    const diaryEntry = this.db.getFirstSync<{ id: string }>('SELECT id FROM diary_entries WHERE date = ?', [date]);
    if (!diaryEntry) return [];

    const rows = this.db.getAllSync<any>(
      'SELECT * FROM meal_entries WHERE diary_entry_id = ? ORDER BY time ASC',
      [diaryEntry.id]
    );

    return rows.map(row => ({
      id: row.id,
      diaryEntryId: row.diary_entry_id,
      name: row.name,
      portions: {
        protein: row.protein,
        fat: row.fat,
        carbs: row.carbs,
        fiber: row.fiber
      },
      time: row.time,
      synced: !!row.synced
    }));
  }

  // Удалить прием пищи
  deleteMeal(id: string): void {
    this.db.runSync('DELETE FROM meal_entries WHERE id = ?', [id]);
  }
}

export const diaryRepository = new DiaryRepository();