export interface DiaryEntry {
  id: string; // UUID
  client_id: string; // UUID
  date: string; // YYYY-MM-DD
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  total_fiber: number;
  synced: number; // 0 (false) or 1 (true) for SQLite
  created_at: string;
  updated_at: string;
}

export interface MealEntry {
  id: string; // UUID
  diary_entry_id: string; // UUID reference
  time: string; // HH:mm
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  comment?: string | null;
  created_at: string;
  updated_at: string;
}

// Тип для создания новой записи (без системных полей)
export type NewMealEntry = Omit<MealEntry, 'id' | 'created_at' | 'updated_at'>;
