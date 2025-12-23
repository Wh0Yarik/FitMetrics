import * as SQLite from 'expo-sqlite';

export interface DailySurveyData {
  id?: string;
  date: string;
  motivation: number;
  sleepHours: number;
  sleepQuality: number;
  stress: number;
  digestion: 'excellent' | 'good' | 'bad';
  water: number;
  hunger: number;
  libido: number;
  weight: number;
  comment: string;
  synced?: boolean;
}

export class DailySurveyRepository {
  private db: SQLite.SQLiteDatabase;

  constructor(dbName: string = 'fitmetrics.db') {
    this.db = SQLite.openDatabaseSync(dbName);
    this.initTable();
  }

  private initTable() {
    // FIX: Проверяем схему. Если нет колонки synced, пересоздаем таблицу
    const columns = this.db.getAllSync<any>('PRAGMA table_info(daily_surveys)');
    const columnNames = columns.map(c => c.name);
    const hasSynced = columnNames.includes('synced');

    if (columns.length > 0 && !hasSynced) {
      this.db.execSync('DROP TABLE IF EXISTS daily_surveys');
    }

    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS daily_surveys (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        motivation INTEGER,
        sleep_hours REAL,
        sleep_quality INTEGER,
        stress INTEGER,
        digestion TEXT,
        water REAL,
        hunger INTEGER,
        libido INTEGER,
        weight REAL,
        comment TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );
    `);
  }

  // Получить анкету за дату
  getSurveyByDate(date: string): DailySurveyData | null {
    const row = this.db.getFirstSync<any>(
      'SELECT * FROM daily_surveys WHERE date = ?',
      [date]
    );

    if (!row) return null;

    return {
      id: row.id,
      date: row.date,
      motivation: row.motivation,
      sleepHours: row.sleep_hours,
      sleepQuality: row.sleep_quality,
      stress: row.stress,
      digestion: row.digestion,
      water: row.water,
      hunger: row.hunger,
      libido: row.libido,
      weight: row.weight,
      comment: row.comment,
      synced: !!row.synced
    };
  }

  // Сохранить анкету (Создать или Обновить)
  saveSurvey(data: DailySurveyData): void {
    const existing = this.getSurveyByDate(data.date);
    const id = existing?.id || crypto.randomUUID();
    const timestamp = new Date().toISOString();

    if (existing) {
      this.db.runSync(
        `UPDATE daily_surveys SET 
          motivation = ?, sleep_hours = ?, sleep_quality = ?, stress = ?, 
          digestion = ?, water = ?, hunger = ?, libido = ?, weight = ?, 
          comment = ?, synced = 0, updated_at = ?
         WHERE id = ?`,
        [
          data.motivation, data.sleepHours, data.sleepQuality, data.stress,
          data.digestion, data.water, data.hunger, data.libido, data.weight,
          data.comment, timestamp, id
        ]
      );
    } else {
      this.db.runSync(
        `INSERT INTO daily_surveys (
          id, date, motivation, sleep_hours, sleep_quality, stress, 
          digestion, water, hunger, libido, weight, comment, synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          id, data.date, data.motivation, data.sleepHours, data.sleepQuality, data.stress,
          data.digestion, data.water, data.hunger, data.libido, data.weight, data.comment, timestamp
        ]
      );
    }
  }

  // Проверка, заполнена ли анкета на сегодня
  isSurveyCompleted(date: string): boolean {
    const result = this.db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM daily_surveys WHERE date = ?',
      [date]
    );
    return (result?.count ?? 0) > 0;
  }
}

export const dailySurveyRepository = new DailySurveyRepository();