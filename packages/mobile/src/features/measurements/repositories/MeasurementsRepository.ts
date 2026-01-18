import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { getCurrentUserIdSync } from '../../../shared/db/userSession';

export interface MeasurementEntry {
  id: string;
  date: string;
  weight?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  leftArm?: number | null;
  rightArm?: number | null;
  leftLeg?: number | null;
  rightLeg?: number | null;
  photoFront?: string | null;
  photoSide?: string | null;
  photoBack?: string | null;
  synced: boolean;
  createdAt: string;
}

export class MeasurementsRepository {
  private db: SQLite.SQLiteDatabase;

  constructor(dbName: string = 'fitmetrics.db') {
    this.db = SQLite.openDatabaseSync(dbName);
    this.initTable();
  }

  private initTable() {
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS measurements (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        user_id TEXT,
        weight REAL,
        chest REAL,
        waist REAL,
        hips REAL,
        left_arm REAL,
        right_arm REAL,
        left_leg REAL,
        right_leg REAL,
        photo_front TEXT,
        photo_side TEXT,
        photo_back TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    const columns = this.db.getAllSync<any>('PRAGMA table_info(measurements)');
    const columnNames = columns.map((c) => c.name);
    if (!columnNames.includes('user_id')) {
      this.db.execSync('ALTER TABLE measurements ADD COLUMN user_id TEXT');
    }
  }

  getAllMeasurements(): MeasurementEntry[] {
    const userId = getCurrentUserIdSync();
    if (!userId) return [];
    const rows = this.db.getAllSync<any>(
      'SELECT * FROM measurements WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    return rows.map(this.mapRowToEntry);
  }

  getMeasurementByDate(date: string): MeasurementEntry | null {
    const userId = getCurrentUserIdSync();
    if (!userId) return null;
    const row = this.db.getFirstSync<any>(
      'SELECT * FROM measurements WHERE date = ? AND user_id = ?',
      [date, userId]
    );
    return row ? this.mapRowToEntry(row) : null;
  }

  getUnsyncedMeasurements(): MeasurementEntry[] {
    const userId = getCurrentUserIdSync();
    if (!userId) return [];
    const rows = this.db.getAllSync<any>(
      'SELECT * FROM measurements WHERE user_id = ? AND synced = 0 ORDER BY date DESC',
      [userId]
    );
    return rows.map(this.mapRowToEntry);
  }

  markMeasurementsAsSynced(ids: string[]): void {
    const userId = getCurrentUserIdSync();
    if (!userId || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    this.db.runSync(
      `UPDATE measurements SET synced = 1, updated_at = ? WHERE user_id = ? AND id IN (${placeholders})`,
      [new Date().toISOString(), userId, ...ids]
    );
  }

  saveMeasurement(data: Omit<MeasurementEntry, 'id' | 'synced' | 'createdAt'> & { id?: string }): void {
    const userId = getCurrentUserIdSync();
    if (!userId) {
      console.warn('saveMeasurement skipped: no user id');
      return;
    }
    const now = new Date().toISOString();
    const existing = data.id ? this.getMeasurementById(data.id) : this.getMeasurementByDate(data.date);
    const id = existing?.id || Crypto.randomUUID();

    if (existing) {
      this.db.runSync(
        `UPDATE measurements SET 
          weight = ?, chest = ?, waist = ?, hips = ?, 
          left_arm = ?, right_arm = ?, left_leg = ?, right_leg = ?,
          photo_front = ?, photo_side = ?, photo_back = ?,
          synced = 0, updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          data.weight ?? null, data.chest ?? null, data.waist ?? null, data.hips ?? null,
          data.leftArm ?? null, data.rightArm ?? null, data.leftLeg ?? null, data.rightLeg ?? null,
          data.photoFront ?? null, data.photoSide ?? null, data.photoBack ?? null,
          now, id, userId
        ]
      );
    } else {
      this.db.runSync(
        `INSERT INTO measurements (
          id, date, user_id, weight, chest, waist, hips, 
          left_arm, right_arm, left_leg, right_leg,
          photo_front, photo_side, photo_back,
          synced, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [
          id, data.date, userId,
          data.weight ?? null, data.chest ?? null, data.waist ?? null, data.hips ?? null,
          data.leftArm ?? null, data.rightArm ?? null, data.leftLeg ?? null, data.rightLeg ?? null,
          data.photoFront ?? null, data.photoSide ?? null, data.photoBack ?? null,
          now, now
        ]
      );
    }
  }

  upsertFromServer(data: {
    id?: string;
    date: string;
    weight?: number | null;
    chest?: number | null;
    waist?: number | null;
    hips?: number | null;
    leftArm?: number | null;
    rightArm?: number | null;
    leftLeg?: number | null;
    rightLeg?: number | null;
    photoFront?: string | null;
    photoSide?: string | null;
    photoBack?: string | null;
  }): void {
    const userId = getCurrentUserIdSync();
    if (!userId) {
      console.warn('upsertFromServer skipped: no user id');
      return;
    }
    const now = new Date().toISOString();
    const existing = data.id ? this.getMeasurementById(data.id) : this.getMeasurementByDate(data.date);
    const id = existing?.id || data.id || Crypto.randomUUID();

    if (existing) {
      this.db.runSync(
        `UPDATE measurements SET 
          weight = ?, chest = ?, waist = ?, hips = ?, 
          left_arm = ?, right_arm = ?, left_leg = ?, right_leg = ?,
          photo_front = ?, photo_side = ?, photo_back = ?,
          synced = 1, updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          data.weight ?? null, data.chest ?? null, data.waist ?? null, data.hips ?? null,
          data.leftArm ?? null, data.rightArm ?? null, data.leftLeg ?? null, data.rightLeg ?? null,
          data.photoFront ?? null, data.photoSide ?? null, data.photoBack ?? null,
          now, id, userId
        ]
      );
      return;
    }

    if (data.id) {
      const anyUserRow = this.db.getFirstSync<any>('SELECT user_id FROM measurements WHERE id = ?', [data.id]);
      if (anyUserRow) {
        this.db.runSync('DELETE FROM measurements WHERE id = ?', [data.id]);
      }
    }

    this.db.runSync(
      `INSERT INTO measurements (
        id, date, user_id, weight, chest, waist, hips, 
        left_arm, right_arm, left_leg, right_leg,
        photo_front, photo_side, photo_back,
        synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id, data.date, userId,
        data.weight ?? null, data.chest ?? null, data.waist ?? null, data.hips ?? null,
        data.leftArm ?? null, data.rightArm ?? null, data.leftLeg ?? null, data.rightLeg ?? null,
        data.photoFront ?? null, data.photoSide ?? null, data.photoBack ?? null,
        now, now
      ]
    );
  }

  deleteMeasurement(id: string): void {
    const userId = getCurrentUserIdSync();
    if (!userId) return;
    this.db.runSync('DELETE FROM measurements WHERE id = ? AND user_id = ?', [id, userId]);
  }

  private getMeasurementById(id: string): MeasurementEntry | null {
     const userId = getCurrentUserIdSync();
     if (!userId) return null;
     const row = this.db.getFirstSync<any>('SELECT * FROM measurements WHERE id = ? AND user_id = ?', [id, userId]);
     return row ? this.mapRowToEntry(row) : null;
  }

  private mapRowToEntry(row: any): MeasurementEntry {
    return {
      id: row.id,
      date: row.date,
      weight: row.weight,
      chest: row.chest,
      waist: row.waist,
      hips: row.hips,
      leftArm: row.left_arm,
      rightArm: row.right_arm,
      leftLeg: row.left_leg,
      rightLeg: row.right_leg,
      photoFront: row.photo_front,
      photoSide: row.photo_side,
      photoBack: row.photo_back,
      synced: !!row.synced,
      createdAt: row.created_at
    };
  }
}

export const measurementsRepository = new MeasurementsRepository();
