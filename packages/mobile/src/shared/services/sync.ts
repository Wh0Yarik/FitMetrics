import { DiaryRepository } from '../db/repositories/diary';
import { api } from '../api/client';
import { getToken } from '../lib/storage';

export const SyncService = {
  isSyncing: false,

  /**
   * Запускает процесс синхронизации данных.
   * Безопасен для повторных вызовов (использует флаг isSyncing).
   */
  sync: async () => {
    if (SyncService.isSyncing) return;
    
    const token = await getToken();
    if (!token) return; // Не синхронизируем, если пользователь не авторизован

    SyncService.isSyncing = true;
    console.log('🔄 Sync Engine: Starting synchronization...');

    try {
      await SyncService.syncDiary();
      console.log('✅ Sync Engine: Synchronization completed');
    } catch (error) {
      console.error('❌ Sync Engine: Failed', error);
    } finally {
      SyncService.isSyncing = false;
    }
  },

  syncDiary: async () => {
    const unsyncedEntries = await DiaryRepository.getUnsyncedEntries();
    
    if (unsyncedEntries.length === 0) {
      return;
    }

    console.log(`🔄 Sync Engine: Found ${unsyncedEntries.length} unsynced diary entries`);

    for (const entry of unsyncedEntries) {
      try {
        const meals = await DiaryRepository.getMealsForDiary(entry.id);
        
        // Формируем payload согласно API
        const payload = {
          date: entry.date,
          meals: meals.map(m => ({
            time: m.time,
            protein: m.protein,
            fat: m.fat,
            carbs: m.carbs,
            fiber: m.fiber,
            comment: m.comment
          }))
        };

        // 1. Отправляем на сервер
        await api.post('/diary/entries', payload);

        // 2. Если успешно, помечаем локально как синхронизированное
        await DiaryRepository.markAsSynced(entry.id);
        console.log(`✅ Sync Engine: Synced diary for ${entry.date}`);
      } catch (e) {
        console.error(`❌ Sync Engine: Failed to sync entry ${entry.date}`, e);
        // Продолжаем цикл, чтобы попытаться синхронизировать остальные записи
      }
    }
  }
};