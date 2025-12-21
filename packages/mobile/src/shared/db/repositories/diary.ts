import { getDb } from '../index';
import { DiaryEntry, MealEntry, NewMealEntry } from '../types';

// Простая утилита для генерации UUID (в продакшене лучше использовать expo-crypto)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const DiaryRepository = {
  /**
   * Получает дневник и список приемов пищи за указанную дату.
   * Возвращает null для diary, если записи еще нет.
   */
  getDiaryDay: async (clientId: string, date: string): Promise<{ diary: DiaryEntry | null; meals: MealEntry[] }> => {
    const db = getDb();

    // Используем новый API (Async)
    if (db.getAllAsync) {
      const diaryRows = await db.getAllAsync(
        `SELECT * FROM diary_entries WHERE client_id = ? AND date = ?`,
        [clientId, date]
      );
      const diary = diaryRows.length > 0 ? (diaryRows[0] as DiaryEntry) : null;

      if (!diary) return { diary: null, meals: [] };

      const meals = await db.getAllAsync(`SELECT * FROM meal_entries WHERE diary_entry_id = ? ORDER BY time ASC`, [diary.id]);
      return { diary, meals: meals as MealEntry[] };
    }
    throw new Error('Legacy SQLite API not supported in this version');
  },

  /**
   * Добавляет прием пищи.
   * - Если записи дневника за этот день нет — создает её.
   * - Вставляет запись о еде.
   * - Обновляет агрегированные показатели (БЖУК) в дневнике.
   * - Сбрасывает флаг synced в 0.
   */
  addMeal: async (clientId: string, date: string, meal: NewMealEntry): Promise<void> => {
    const db = getDb();
    const newMealId = generateUUID();
    const now = new Date().toISOString();

    const runTransaction = async () => {
      // 1. Проверяем наличие дневника
      const diaryRows: any[] = await db.getAllAsync(
        `SELECT id FROM diary_entries WHERE client_id = ? AND date = ?`,
        [clientId, date]
      );

      let diaryId: string;

      if (diaryRows.length > 0) {
        diaryId = diaryRows[0].id;
      } else {
        diaryId = generateUUID();
        await db.runAsync(
          `INSERT INTO diary_entries (id, client_id, date, total_protein, total_fat, total_carbs, total_fiber, synced, created_at, updated_at)
           VALUES (?, ?, ?, 0, 0, 0, 0, 0, ?, ?)`,
          [diaryId, clientId, date, now, now]
        );
      }

      // 2. Вставляем еду
      await db.runAsync(
        `INSERT INTO meal_entries (id, diary_entry_id, time, protein, fat, carbs, fiber, comment, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newMealId, diaryId, meal.time, meal.protein, meal.fat, meal.carbs, meal.fiber, meal.comment || null, now, now]
      );

      // 3. Обновляем итоги
      await db.runAsync(
        `UPDATE diary_entries 
         SET total_protein = total_protein + ?,
             total_fat = total_fat + ?,
             total_carbs = total_carbs + ?,
             total_fiber = total_fiber + ?,
             synced = 0,
             updated_at = ?
         WHERE id = ?`,
        [meal.protein, meal.fat, meal.carbs, meal.fiber, now, diaryId]
      );
    };

    // Используем транзакцию, если доступна
    if (db.withTransactionAsync) {
      await db.withTransactionAsync(runTransaction);
    } else {
      // Фолбэк без транзакции (или для старых версий)
      await runTransaction();
    }
  },

  /**
   * Получает список записей дневника, которые еще не были отправлены на сервер.
   */
  getUnsyncedEntries: async (): Promise<DiaryEntry[]> => {
    const db = getDb();
    if (db.getAllAsync) {
      return await db.getAllAsync(`SELECT * FROM diary_entries WHERE synced = 0`);
    }
    return [];
  },

  getMealsForDiary: async (diaryId: string): Promise<MealEntry[]> => {
    const db = getDb();
    if (db.getAllAsync) {
      return await db.getAllAsync(`SELECT * FROM meal_entries WHERE diary_entry_id = ?`, [diaryId]);
    }
    return [];
  },

  markAsSynced: async (diaryId: string): Promise<void> => {
    const db = getDb();
    if (db.runAsync) {
      await db.runAsync(`UPDATE diary_entries SET synced = 1 WHERE id = ?`, [diaryId]);
    }
  }
};