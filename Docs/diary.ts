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
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // 1. Ищем запись дневника за день
        tx.executeSql(
          `SELECT * FROM diary_entries WHERE client_id = ? AND date = ?`,
          [clientId, date],
          (_, { rows: { _array } }) => {
            const diary = _array.length > 0 ? (_array[0] as DiaryEntry) : null;
            
            if (!diary) {
              resolve({ diary: null, meals: [] });
              return;
            }

            // 2. Если дневник есть, загружаем приемы пищи
            tx.executeSql(
              `SELECT * FROM meal_entries WHERE diary_entry_id = ? ORDER BY time ASC`,
              [diary.id],
              (_, { rows: { _array: meals } }) => {
                resolve({ diary, meals: meals as MealEntry[] });
              },
              (_, error) => {
                console.error('Error fetching meals:', error);
                reject(error);
                return false;
              }
            );
          },
          (_, error) => {
            console.error('Error fetching diary:', error);
            reject(error);
            return false;
          }
        );
      });
    });
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
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // 1. Проверяем наличие дневника
        tx.executeSql(
          `SELECT id FROM diary_entries WHERE client_id = ? AND date = ?`,
          [clientId, date],
          (_, { rows: { _array } }) => {
            let diaryId: string;

            // Вспомогательная функция для вставки еды и обновления итогов
            const insertMealAndUpdateDiary = (dId: string) => {
              // Вставляем еду
              tx.executeSql(
                `INSERT INTO meal_entries (id, diary_entry_id, time, protein, fat, carbs, fiber, comment, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  newMealId, 
                  dId, 
                  meal.time, 
                  meal.protein, 
                  meal.fat, 
                  meal.carbs, 
                  meal.fiber, 
                  meal.comment || null,
                  now,
                  now
                ],
                () => {
                  // Обновляем суммы в дневнике и ставим synced = 0
                  tx.executeSql(
                    `UPDATE diary_entries 
                     SET total_protein = total_protein + ?,
                         total_fat = total_fat + ?,
                         total_carbs = total_carbs + ?,
                         total_fiber = total_fiber + ?,
                         synced = 0,
                         updated_at = ?
                     WHERE id = ?`,
                    [
                      meal.protein, 
                      meal.fat, 
                      meal.carbs, 
                      meal.fiber, 
                      now,
                      dId
                    ],
                    () => resolve(),
                    (_, err) => { reject(err); return false; }
                  );
                },
                (_, err) => { reject(err); return false; }
              );
            };

            if (_array.length > 0) {
              // Дневник существует
              diaryId = _array[0].id;
              insertMealAndUpdateDiary(diaryId);
            } else {
              // Дневника нет, создаем новый
              diaryId = generateUUID();
              tx.executeSql(
                `INSERT INTO diary_entries (id, client_id, date, total_protein, total_fat, total_carbs, total_fiber, synced, created_at, updated_at)
                 VALUES (?, ?, ?, 0, 0, 0, 0, 0, ?, ?)`,
                [diaryId, clientId, date, now, now],
                () => insertMealAndUpdateDiary(diaryId),
                (_, err) => { reject(err); return false; }
              );
            }
          },
          (_, err) => { 
            console.error('Error checking diary existence:', err);
            reject(err); 
            return false; 
          }
        );
      });
    });
  }
};