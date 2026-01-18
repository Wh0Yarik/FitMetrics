import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { measurementsRepository, MeasurementEntry } from '../repositories/MeasurementsRepository';
import { colors } from '../../../shared/ui';
import { dailySurveyRepository } from '../../diary/repositories/DailySurveyRepository';
import { api } from '../../../shared/api/client';
import { getToken } from '../../../shared/lib/storage';
import { formatDateKey, getDateObj } from '../../../shared/lib/date';
import { buildLinePath } from '../lib/buildLinePath';

export type StatsCard = {
  key: 'weight' | 'waist' | 'hips' | 'chest' | 'arms' | 'legs';
  label: string;
  unit: string;
  color: string;
  secondaryColor?: string;
  latestValue: number | null;
  latestPair?: { left: number | null; right: number | null };
  delta: number | null;
  series: number[];
  linePath: string;
  linePoints: { x: number; y: number }[];
  secondaryLinePath?: string;
  secondaryLinePoints?: { x: number; y: number }[];
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
      const token = await getToken();
      if (!token) {
        setSyncStatus('synced');
        return;
      }

      const pending = measurementsRepository.getUnsyncedMeasurements();
      for (const entry of pending) {
        await api.post('/measurements/entries', {
          date: entry.date,
          chest: entry.chest ?? null,
          waist: entry.waist ?? null,
          hips: entry.hips ?? null,
          leftArm: entry.leftArm ?? null,
          rightArm: entry.rightArm ?? null,
          leftLeg: entry.leftLeg ?? null,
          rightLeg: entry.rightLeg ?? null,
        });
      }
      measurementsRepository.markMeasurementsAsSynced(pending.map((entry) => entry.id));

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
  const entriesByMetric = useCallback(
    (key: StatsCard['key']) => {
      if (key === 'weight') {
        return measurementsSorted;
      }
      return measurementsSorted.filter((item) => {
        if (key === 'arms') {
          return typeof item.leftArm === 'number' || typeof item.rightArm === 'number';
        }
        if (key === 'legs') {
          return typeof item.leftLeg === 'number' || typeof item.rightLeg === 'number';
        }
        return typeof item[key] === 'number';
      });
    },
    [measurementsSorted]
  );
  const weightSeries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rawSeries = Array.from({ length: 14 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (13 - index));
      const dateStr = formatDateKey(day);
      const entry = measurementsByDate.get(dateStr);
      if (entry?.weight != null) return entry.weight;
      return getSurveyWeight(dateStr);
    });
    const filled = [...rawSeries];
    let startIndex = 0;
    while (startIndex < filled.length) {
      if (filled[startIndex] != null) {
        startIndex += 1;
        continue;
      }
      let endIndex = startIndex;
      while (endIndex < filled.length && filled[endIndex] == null) {
        endIndex += 1;
      }
      const prevValue = startIndex > 0 ? filled[startIndex - 1] : null;
      const nextValue = endIndex < filled.length ? filled[endIndex] : null;
      if (prevValue != null && nextValue != null) {
        const gap = endIndex - startIndex + 1;
        for (let i = startIndex; i < endIndex; i += 1) {
          const t = (i - startIndex + 1) / gap;
          filled[i] = prevValue + (nextValue - prevValue) * t;
        }
      }
      startIndex = endIndex + 1;
    }
    return filled;
  }, [measurementsByDate, getSurveyWeight]);

  const statsCards = useMemo<StatsCard[]>(() => {
    const configs = [
      { key: 'weight', label: 'Вес', unit: 'кг', color: colors.accentFiber },
      { key: 'waist', label: 'Талия', unit: 'см', color: colors.accentCarbs },
      { key: 'hips', label: 'Бедра', unit: 'см', color: colors.accentFat },
      { key: 'chest', label: 'Грудь', unit: 'см', color: colors.accentProtein },
      { key: 'arms', label: 'Руки', unit: 'см', color: colors.accentCarbs, secondaryColor: colors.accentProtein },
      { key: 'legs', label: 'Ноги', unit: 'см', color: colors.accentFat, secondaryColor: colors.accentFiber },
    ] as const;

    return configs.map((config) => {
      const isDual = config.key === 'arms' || config.key === 'legs';
      const metricEntries = entriesByMetric(config.key);
      const valuesSource = config.key === 'weight'
        ? weightSeries
        : config.key === 'arms'
          ? metricEntries.map((item) => item.leftArm ?? null)
          : config.key === 'legs'
            ? metricEntries.map((item) => item.leftLeg ?? null)
            : metricEntries.map((item) => item[config.key] ?? null);
      const secondaryValuesSource = config.key === 'arms'
        ? metricEntries.map((item) => item.rightArm ?? null)
        : config.key === 'legs'
          ? metricEntries.map((item) => item.rightLeg ?? null)
          : null;

      const avgSeries = isDual
        ? valuesSource.map((value, index) => {
            const secondary = secondaryValuesSource ? secondaryValuesSource[index] : null;
            if (value == null && secondary == null) return null;
            if (value == null) return secondary;
            if (secondary == null) return value;
            return (value + secondary) / 2;
          })
        : valuesSource;

      const values = avgSeries.filter((value): value is number => typeof value === 'number');
      const latestValue = values.length > 0 ? values[values.length - 1] : null;
      const prevValue = values.length > 1 ? values[values.length - 2] : null;
      const delta = latestValue != null && prevValue != null ? latestValue - prevValue : null;
      const latestPair = isDual
        ? {
            left: valuesSource[valuesSource.length - 1] ?? null,
            right: secondaryValuesSource ? secondaryValuesSource[secondaryValuesSource.length - 1] ?? null : null,
          }
        : undefined;

      const recentMetric = entriesByMetric(config.key).slice(-5);
      const seriesValues = config.key === 'weight'
        ? weightSeries
        : config.key === 'arms'
          ? metricEntries.map((item) => {
              const left = typeof item.leftArm === 'number' ? item.leftArm : null;
              const right = typeof item.rightArm === 'number' ? item.rightArm : null;
              if (left == null && right == null) return null;
              if (left == null) return right;
              if (right == null) return left;
              return (left + right) / 2;
            })
          : config.key === 'legs'
            ? metricEntries.map((item) => {
                const left = typeof item.leftLeg === 'number' ? item.leftLeg : null;
                const right = typeof item.rightLeg === 'number' ? item.rightLeg : null;
                if (left == null && right == null) return null;
                if (left == null) return right;
                if (right == null) return left;
                return (left + right) / 2;
              })
            : metricEntries.map((item) => item[config.key] ?? null);
      const secondarySeriesValues = config.key === 'arms'
        ? metricEntries.map((item) => (typeof item.rightArm === 'number' ? item.rightArm : null))
        : config.key === 'legs'
          ? metricEntries.map((item) => (typeof item.rightLeg === 'number' ? item.rightLeg : null))
          : null;
      const numericSeries = seriesValues.filter((value): value is number => value != null);
      const maxValue = numericSeries.length > 0 ? Math.max(...numericSeries) : 0;
      const series = seriesValues.map((value) => {
        if (value == null || maxValue === 0) return 0;
        return Math.max(0.12, value / maxValue);
      });
      const lineData = buildLinePath(seriesValues);
      const secondaryLineData = secondarySeriesValues ? buildLinePath(secondarySeriesValues) : null;

      return {
        ...config,
        latestValue,
        latestPair,
        delta,
        series,
        linePath: lineData.path,
        linePoints: lineData.points,
        secondaryLinePath: secondaryLineData?.path,
        secondaryLinePoints: secondaryLineData?.points,
      };
    });
  }, [buildLinePath, entriesByMetric, measurementsSorted, weightSeries]);

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
