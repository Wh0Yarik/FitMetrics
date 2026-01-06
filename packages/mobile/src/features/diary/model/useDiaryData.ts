import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { diaryRepository, MealEntry } from '../repositories/DiaryRepository';
import { dailySurveyRepository, DailySurveyData } from '../repositories/DailySurveyRepository';

export type DiarySurveyStatus = 'empty' | 'partial' | 'complete';

export const isSurveyComplete = (survey: DailySurveyData) =>
  survey.weight != null &&
  survey.motivation != null &&
  survey.sleep != null &&
  survey.stress != null &&
  survey.digestion != null &&
  survey.water != null &&
  survey.hunger != null &&
  survey.libido != null;

export const useDiaryData = (currentDate: string) => {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [surveyStatus, setSurveyStatus] = useState<DiarySurveyStatus>('empty');
  const [dailySurvey, setDailySurvey] = useState<DailySurveyData | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local'>('synced');

  const loadData = useCallback(() => {
    const loadedMeals = diaryRepository.getMealsByDate(currentDate);
    setMeals(loadedMeals);
    setSyncStatus(loadedMeals.some((meal) => !meal.synced) ? 'local' : 'synced');

    const survey = dailySurveyRepository.getSurveyByDate(currentDate);
    setDailySurvey(survey);

    if (!survey) {
      setSurveyStatus('empty');
    } else {
      setSurveyStatus(isSurveyComplete(survey) ? 'complete' : 'partial');
    }
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return { meals, surveyStatus, dailySurvey, syncStatus, setSyncStatus, refreshData: loadData };
};
