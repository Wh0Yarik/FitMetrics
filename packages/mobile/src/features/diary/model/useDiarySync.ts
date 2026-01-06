import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

import { diaryRepository } from '../repositories/DiaryRepository';
import { dailySurveyRepository } from '../repositories/DailySurveyRepository';
import { api } from '../../../shared/api/client';
import { getToken } from '../../../shared/lib/storage';
import { shiftDate } from '../../../shared/lib/date';

type UseDiarySyncParams = {
  currentDate: string;
  syncStatus: 'synced' | 'syncing' | 'local';
  setSyncStatus: (status: 'synced' | 'syncing' | 'local') => void;
  refreshData: () => void;
};

export const useDiarySync = ({
  currentDate,
  syncStatus,
  setSyncStatus,
  refreshData,
}: UseDiarySyncParams) => {
  const syncInFlightRef = useRef(false);
  const surveySyncInFlightRef = useRef(false);
  const lastSurveySyncAttemptRef = useRef<Record<string, number>>({});
  const lastSurveyPullRef = useRef(0);
  const lastDiaryPullRef = useRef(0);
  const lastSyncAttemptRef = useRef<Record<string, number>>({});

  const syncDiaryForDate = useCallback(async (force?: boolean) => {
    if (syncInFlightRef.current) return;
    if (!force) {
      const lastAttempt = lastSyncAttemptRef.current[currentDate] ?? 0;
      if (Date.now() - lastAttempt < 15000) {
        return;
      }
      lastSyncAttemptRef.current[currentDate] = Date.now();
    }

    const token = await getToken();
    if (!token) {
      setSyncStatus('local');
      return;
    }

    const mealsForDate = diaryRepository.getMealsByDate(currentDate);
    if (mealsForDate.length === 0) {
      setSyncStatus('synced');
      return;
    }

    syncInFlightRef.current = true;
    setSyncStatus('syncing');
    try {
      await api.post('/diary/entries', {
        date: currentDate,
        meals: mealsForDate.map((meal) => ({
          name: meal.name,
          time: meal.time,
          protein: meal.portions.protein,
          fat: meal.portions.fat,
          carbs: meal.portions.carbs,
          fiber: meal.portions.fiber,
        })),
      });

      diaryRepository.markMealsAsSynced(currentDate);
      setSyncStatus('synced');
      refreshData();
    } catch (error: any) {
      const status = error?.response?.status;
      const payload = error?.response?.data;
      console.error('Failed to sync diary entries', {
        message: error?.message,
        status,
        payload,
      });
      setSyncStatus('local');
    } finally {
      syncInFlightRef.current = false;
    }
  }, [currentDate, refreshData, setSyncStatus]);

  useEffect(() => {
    if (syncStatus === 'local' && diaryRepository.hasUnsyncedMeals(currentDate)) {
      syncDiaryForDate();
    }
  }, [currentDate, syncDiaryForDate, syncStatus]);

  const syncSurveyForDate = useCallback(async (force?: boolean) => {
    if (surveySyncInFlightRef.current) return;
    if (!force) {
      const lastAttempt = lastSurveySyncAttemptRef.current[currentDate] ?? 0;
      if (Date.now() - lastAttempt < 15000) {
        return;
      }
      lastSurveySyncAttemptRef.current[currentDate] = Date.now();
    }

    const token = await getToken();
    if (!token) return;

    const survey = dailySurveyRepository.getSurveyByDate(currentDate);
    if (!survey || survey.synced) return;

    surveySyncInFlightRef.current = true;
    try {
      await api.post('/surveys/entries', {
        date: currentDate,
        weight: survey.weight ?? null,
        motivation: survey.motivation ?? null,
        sleep: survey.sleep ?? null,
        stress: survey.stress ?? null,
        digestion: survey.digestion ?? null,
        water: survey.water ?? null,
        hunger: survey.hunger ?? null,
        libido: survey.libido ?? null,
        comment: survey.comment ?? null,
      });

      dailySurveyRepository.markSurveyAsSynced(currentDate);
      refreshData();
    } catch (error: any) {
      const status = error?.response?.status;
      const payload = error?.response?.data;
      console.error('Failed to sync daily survey', {
        message: error?.message,
        status,
        payload,
      });
    } finally {
      surveySyncInFlightRef.current = false;
    }
  }, [currentDate, refreshData]);

  useEffect(() => {
    if (dailySurveyRepository.hasUnsyncedSurvey(currentDate)) {
      syncSurveyForDate();
    }
  }, [currentDate, syncSurveyForDate]);

  const syncSurveysFromServer = useCallback(async (force?: boolean) => {
    if (!force && Date.now() - lastSurveyPullRef.current < 30000) {
      return;
    }
    lastSurveyPullRef.current = Date.now();

    try {
      const response = await api.get('/surveys/entries');
      const items = Array.isArray(response.data) ? response.data : [];
      items.forEach((item: any) => {
        if (!item?.date) return;
        dailySurveyRepository.upsertFromServer({
          date: item.date,
          weight: item.weight ?? null,
          motivation: item.motivation ?? null,
          sleep: item.sleep ?? null,
          stress: item.stress ?? null,
          digestion: item.digestion ?? null,
          water: item.water ?? null,
          hunger: item.hunger ?? null,
          libido: item.libido ?? null,
          comment: item.comment ?? undefined,
          synced: true,
        });
      });
      refreshData();
    } catch (error: any) {
      const status = error?.response?.status;
      const payload = error?.response?.data;
      console.error('Failed to pull daily surveys', {
        message: error?.message,
        status,
        payload,
      });
    }
  }, [refreshData]);

  useFocusEffect(
    useCallback(() => {
      syncSurveysFromServer();
    }, [syncSurveysFromServer])
  );

  const syncDiaryFromServer = useCallback(async (force?: boolean) => {
    if (!force && Date.now() - lastDiaryPullRef.current < 30000) {
      return;
    }
    lastDiaryPullRef.current = Date.now();

    try {
      const from = shiftDate(currentDate, -90);
      const response = await api.get('/diary/entries', { params: { from } });
      const items = Array.isArray(response.data) ? response.data : [];
      items.forEach((entry: any) => {
        if (!entry?.date) return;
        const meals = Array.isArray(entry.meals)
          ? entry.meals.map((meal: any) => ({
              name: meal.name ?? '',
              time: meal.time ?? null,
              protein: meal.protein ?? 0,
              fat: meal.fat ?? 0,
              carbs: meal.carbs ?? 0,
              fiber: meal.fiber ?? 0,
            }))
          : [];
        diaryRepository.replaceMealsFromServer(entry.date, meals);
      });
      refreshData();
    } catch (error: any) {
      const status = error?.response?.status;
      const payload = error?.response?.data;
      console.error('Failed to pull diary entries', {
        message: error?.message,
        status,
        payload,
      });
    }
  }, [currentDate, refreshData]);

  useFocusEffect(
    useCallback(() => {
      syncDiaryFromServer();
    }, [syncDiaryFromServer])
  );

  return { syncDiaryForDate, syncSurveyForDate, syncSurveysFromServer, syncDiaryFromServer };
};
