import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { measurementsRepository, MeasurementEntry } from '../repositories/MeasurementsRepository';
import { dailySurveyRepository } from '../../diary/repositories/DailySurveyRepository';
import { api } from '../../../shared/api/client';
import { formatDateKey, getDateObj } from '../../../shared/lib/date';
import { buildLinePath } from '../lib/buildLinePath';

export type StatsCard = {
  key: 'weight' | 'waist' | 'hips' | 'chest';
  label: string;
  unit: string;
  color: string;
  latestValue: number | null;
  delta: number | null;
  series: number[];
  linePath: string;
};

type WeeklyLatestInfo = {
  label: string;
  isRecent: boolean;
  entry: MeasurementEntry | null;
};

type UseMeasurementsDataParams = {
  currentDate: string;
  setSyncStatus: (status: 'synced' | 'syncing') => void;
};

export const useMeasurementsData = ({
  currentDate,
  setSyncStatus,
}: UseMeasurementsDataParams) => {
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);

  const loadData = useCallback(() => {
    const data = measurementsRepository.getAllMeasurements();
    setMeasurements(data);
  }, []);

  const getSurveyWeight = useCallback((dateStr: string) => {
    const survey = dailySurveyRepository.getSurveyByDate(dateStr);
    return survey?.weight ?? null;
  }, []);

  const enrichedMeasurements = useMemo(
    () => measurements.map((entry) => {
      if (entry.weight != null) return entry;
      const surveyWeight = getSurveyWeight(entry.date);
      return surveyWeight != null ? { ...entry, weight: surveyWeight } : entry;
    }),
    [measurements, getSurveyWeight]
  );

  const syncMeasurements = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const response = await api.get('/measurements/entries');
      const items = Array.isArray(response.data) ? response.data : [];
      items.forEach((item: any) => {
        const date = typeof item.date === 'string' ? item.date.slice(0, 10) : '';
        if (!date) return;
        measurementsRepository.upsertFromServer({
          id: item.id,
          date,
          chest: item.chest ?? null,
          waist: item.waist ?? null,
          hips: item.hips ?? null,
          leftArm: item.arms ?? null,
          rightArm: item.arms ?? null,
          leftLeg: item.legs ?? null,
          rightLeg: item.legs ?? null,
          photoFront: item.photoFront ?? null,
          photoSide: item.photoSide ?? null,
          photoBack: item.photoBack ?? null,
        });
      });
      loadData();
    } catch (error: any) {
      const status = error?.response?.status;
      const payload = error?.response?.data;
      console.error('Failed to sync measurements', {
        message: error?.message,
        status,
        payload,
      });
    } finally {
      setSyncStatus('synced');
    }
  }, [loadData, setSyncStatus]);

  const measurementsByDate = useMemo(() => {
    const map = new Map<string, MeasurementEntry>();
    enrichedMeasurements.forEach((entry) => {
      map.set(entry.date, entry);
    });
    return map;
  }, [enrichedMeasurements]);

  const weeklyLatestInfo = useMemo<WeeklyLatestInfo | null>(() => {
    if (enrichedMeasurements.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const latest = enrichedMeasurements.reduce<Date | null>((acc, entry) => {
      const date = getDateObj(entry.date);
      date.setHours(0, 0, 0, 0);
      if (date > today) return acc;
      if (!acc || date > acc) return date;
      return acc;
    }, null);
    if (!latest) return null;
    const diffDays = Math.max(0, Math.round((today.getTime() - latest.getTime()) / 86400000));
    const isRecent = diffDays <= 6;
    const latestKey = formatDateKey(latest);
    const entry = enrichedMeasurements.find((item) => item.date === latestKey) ?? null;
    if (diffDays === 0) {
      return { label: 'сегодня', isRecent, entry };
    }
    const mod10 = diffDays % 10;
    const mod100 = diffDays % 100;
    const suffix = mod10 === 1 && mod100 !== 11
      ? 'день'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)
        ? 'дня'
        : 'дней';
    return { label: `${diffDays} ${suffix} назад`, isRecent, entry };
  }, [enrichedMeasurements]);

  const currentMeasurement = measurementsByDate.get(currentDate) ?? null;
  const measurementsSorted = useMemo(
    () => [...enrichedMeasurements].sort((a, b) => a.date.localeCompare(b.date)),
    [enrichedMeasurements]
  );
  const recentMeasurements = useMemo(
    () => measurementsSorted.slice(-7),
    [measurementsSorted]
  );
  const weightSeries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (13 - index));
      const dateStr = formatDateKey(day);
      const entry = measurementsByDate.get(dateStr);
      if (entry?.weight != null) return entry.weight;
      return getSurveyWeight(dateStr);
    });
  }, [measurementsByDate, getSurveyWeight]);

  const statsCards = useMemo<StatsCard[]>(() => {
    const configs = [
      { key: 'weight', label: 'Вес', unit: 'кг', color: '#22C55E' },
      { key: 'waist', label: 'Талия', unit: 'см', color: '#3B82F6' },
      { key: 'hips', label: 'Бедра', unit: 'см', color: '#F59E0B' },
      { key: 'chest', label: 'Грудь', unit: 'см', color: '#8B5CF6' },
    ] as const;

    return configs.map((config) => {
      const valuesSource = config.key === 'weight'
        ? weightSeries
        : measurementsSorted.map((item) => item[config.key] ?? null);
      const values = valuesSource.filter((value): value is number => typeof value === 'number');
      const latestValue = values.length > 0 ? values[values.length - 1] : null;
      const prevValue = values.length > 1 ? values[values.length - 2] : null;
      const delta = latestValue != null && prevValue != null ? latestValue - prevValue : null;

      const seriesValues = config.key === 'weight'
        ? weightSeries
        : [
            ...Array(Math.max(0, 7 - recentMeasurements.length)).fill(null),
            ...recentMeasurements.map((item) => {
              const value = item[config.key];
              return typeof value === 'number' ? value : null;
            }),
          ];
      const numericSeries = seriesValues.filter((value): value is number => value != null);
      const maxValue = numericSeries.length > 0 ? Math.max(...numericSeries) : 0;
      const series = seriesValues.map((value) => {
        if (value == null || maxValue === 0) return 0;
        return Math.max(0.12, value / maxValue);
      });
      const linePath = config.key === 'weight' ? buildLinePath(seriesValues) : '';

      return {
        ...config,
        latestValue,
        delta,
        series,
        linePath,
      };
    });
  }, [buildLinePath, measurementsSorted, recentMeasurements, weightSeries]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      syncMeasurements();
    }, [loadData, syncMeasurements])
  );

  return {
    measurements: enrichedMeasurements,
    measurementsByDate,
    weeklyLatestInfo,
    currentMeasurement,
    statsCards,
    loadData,
    syncMeasurements,
  };
};
