import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { getCurrentUserIdSync } from '../../../shared/db/userSession';

export interface DailySurveyData {
  id?: string;
  date: string;
  weight?: number | null;
  motivation?: 'low' | 'moderate' | 'high' | null;
  sleep?: '0-4' | '4-6' | '6-8' | '8+' | null;
  stress?: 'low' | 'moderate' | 'high' | null;
  digestion?: '0' | '1' | '2+' | null;
  water?: '0-1' | '1-2' | '2-3' | '2+' | null;
  hunger?: 'no_appetite' | 'moderate' | 'constant' | null;
  libido?: 'low' | 'moderate' | 'high' | null;
  comment?: string;
  synced?: boolean;
}

export class DailySurveyRepository {
  private db: SQLite.SQLiteDatabase;

  constructor(dbName: string = 'fitmetrics.db') {
    this.db = SQLite.openDatabaseSync(dbName);
    this.initTable();
  }

  private initTable() {
    // FIX: Проверяем схему. Если нет колонки sleep (новая схема), пересоздаем таблицу
    const columns = this.db.getAllSync<any>('PRAGMA table_info(daily_surveys)');
    const columnNames = columns.map(c => c.name);
    const hasSleep = columnNames.includes('sleep');

    if (columns.length > 0 && !hasSleep) {
      this.db.execSync('DROP TABLE IF EXISTS daily_surveys');
    }

    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS daily_surveys (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        date TEXT NOT NULL,
        weight REAL,
        motivation TEXT,
        sleep TEXT,
        stress TEXT,
        digestion TEXT,
        water TEXT,
        hunger TEXT,
        libido TEXT,
        comment TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    const updatedColumns = this.db.getAllSync<any>('PRAGMA table_info(daily_surveys)');
    const updatedNames = updatedColumns.map(c => c.name);
    if (!updatedNames.includes('user_id')) {
      this.db.execSync('ALTER TABLE daily_surveys ADD COLUMN user_id TEXT');
    }
  }

  // Получить анкету за дату
  getSurveyByDate(date: string): DailySurveyData | null {
    const userId = getCurrentUserIdSync();
    if (!userId) return null;
    const row = this.db.getFirstSync<any>(
      'SELECT * FROM daily_surveys WHERE date = ? AND user_id = ?',
      [date, userId]
    );

    if (!row) return null;

    return {
      id: row.id,
      date: row.date,
      weight: row.weight,
      motivation: row.motivation,
      sleep: row.sleep,
      stress: row.stress,
      digestion: row.digestion,
      water: row.water,
      hunger: row.hunger,
      libido: row.libido,
      comment: row.comment,
      synced: !!row.synced
    };
  }

  // Сохранить анкету (Создать или Обновить)
  saveSurvey(data: DailySurveyData): void {
    const userId = getCurrentUserIdSync();
    if (!userId) {
      console.warn('saveSurvey skipped: no user id');
      return;
    }
    const existing = this.getSurveyByDate(data.date);
    const id = existing?.id || Crypto.randomUUID();
    const timestamp = new Date().toISOString();

    if (existing) {
      this.db.runSync(
        `UPDATE daily_surveys SET 
          weight = ?, motivation = ?, sleep = ?, stress = ?, 
          digestion = ?, water = ?, hunger = ?, libido = ?, 
          comment = ?, synced = 0, updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          data.weight, data.motivation, data.sleep, data.stress,
          data.digestion, data.water, data.hunger, data.libido,
          data.comment, timestamp, id, userId
        ]
      );
    } else {
      this.db.runSync(
        `INSERT INTO daily_surveys (
          id, user_id, date, weight, motivation, sleep, stress, 
          digestion, water, hunger, libido, comment, synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          id, userId, data.date, data.weight, data.motivation, data.sleep, data.stress,
          data.digestion, data.water, data.hunger, data.libido, data.comment, timestamp
        ]
      );
    }
  }

  updateWeightForDate(date: string, weight: number | null): void {
    const existing = this.getSurveyByDate(date);
    const payload: DailySurveyData = {
      date,
      weight,
      motivation: existing?.motivation ?? null,
      sleep: existing?.sleep ?? null,
      stress: existing?.stress ?? null,
      digestion: existing?.digestion ?? null,
      water: existing?.water ?? null,
      hunger: existing?.hunger ?? null,
      libido: existing?.libido ?? null,
      comment: existing?.comment,
    };
    this.saveSurvey(payload);
  }


  upsertFromServer(data: DailySurveyData): void {
    const userId = getCurrentUserIdSync();
    if (!userId) {
      console.warn('upsertFromServer skipped: no user id');
      return;
    }
    const existing = this.getSurveyByDate(data.date);
    const id = existing?.id || data.id || Crypto.randomUUID();
    const timestamp = new Date().toISOString();

    if (existing) {
      this.db.runSync(
        `UPDATE daily_surveys SET 
          weight = ?, motivation = ?, sleep = ?, stress = ?, 
          digestion = ?, water = ?, hunger = ?, libido = ?, 
          comment = ?, synced = 1, updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          data.weight ?? null, data.motivation ?? null, data.sleep ?? null, data.stress ?? null,
          data.digestion ?? null, data.water ?? null, data.hunger ?? null, data.libido ?? null,
          data.comment ?? null, timestamp, id, userId
        ]
      );
      return;
    }

    this.db.runSync(
      `INSERT INTO daily_surveys (
        id, user_id, date, weight, motivation, sleep, stress, 
        digestion, water, hunger, libido, comment, synced, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        id, userId, data.date, data.weight ?? null, data.motivation ?? null, data.sleep ?? null, data.stress ?? null,
        data.digestion ?? null, data.water ?? null, data.hunger ?? null, data.libido ?? null, data.comment ?? null, timestamp
      ]
    );
  }


  hasUnsyncedSurvey(date: string): boolean {
    const userId = getCurrentUserIdSync();
    if (!userId) return false;
    const row = this.db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM daily_surveys WHERE date = ? AND user_id = ? AND synced = 0',
      [date, userId]
    );
    return (row?.count ?? 0) > 0;
  }


  markSurveyAsSynced(date: string): void {
    const userId = getCurrentUserIdSync();
    if (!userId) return;
    const now = new Date().toISOString();
    this.db.runSync(
      'UPDATE daily_surveys SET synced = 1, updated_at = ? WHERE date = ? AND user_id = ?',
      [now, date, userId]
    );
  }


  // Проверка, заполнена ли анкета на сегодня
  isSurveyCompleted(date: string): boolean {
    const userId = getCurrentUserIdSync();
    if (!userId) return false;
    const result = this.db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM daily_surveys WHERE date = ? AND user_id = ?',
      [date, userId]
    );
    return (result?.count ?? 0) > 0;
  }


  // Получить список дат с заполненными анкетами за месяц
  getDatesWithSurveys(year: string, month: string): string[] {
    const userId = getCurrentUserIdSync();
    if (!userId) return [];
    const pattern = `${year}-${month}-%`;
    const rows = this.db.getAllSync<{ date: string }>(
      'SELECT DISTINCT date FROM daily_surveys WHERE date LIKE ? AND user_id = ?',
      [pattern, userId]
    );
    return rows.map(r => r.date);
  }


  // Получить список дат с ПОЛНОСТЬЮ заполненными анкетами за месяц
  getCompletedSurveyDates(year: string, month: string): string[] {
    const userId = getCurrentUserIdSync();
    if (!userId) return [];
    const pattern = `${year}-${month}-%`;
    const rows = this.db.getAllSync<{ date: string }>(
      `SELECT DISTINCT date FROM daily_surveys 
       WHERE date LIKE ? 
       AND user_id = ?
       AND weight IS NOT NULL 
       AND motivation IS NOT NULL 
       AND sleep IS NOT NULL 
       AND stress IS NOT NULL 
       AND digestion IS NOT NULL 
       AND water IS NOT NULL 
       AND hunger IS NOT NULL 
       AND libido IS NOT NULL`,
      [pattern, userId]
    );
    return rows.map(r => r.date);
  }

}

export const dailySurveyRepository = new DailySurveyRepository();
