import { diaryRepository } from '../../features/diary/repositories/DiaryRepository';
import { dailySurveyRepository } from '../../features/diary/repositories/DailySurveyRepository';
import { measurementsRepository } from '../../features/measurements/repositories/MeasurementsRepository';

const toDateString = (date: Date) => date.toISOString().split('T')[0];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round1 = (value: number) => Math.round(value * 10) / 10;

export const seedLocalData = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let mealsAdded = 0;
  let surveysSaved = 0;

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = toDateString(date);

    const existingMeals = diaryRepository.getMealsByDate(dateStr);
    if (existingMeals.length === 0) {
      for (let mealIndex = 0; mealIndex < 3; mealIndex += 1) {
        diaryRepository.addMeal(dateStr, `Прием пищи ${mealIndex + 1}`, {
          protein: 1 + ((i + mealIndex) % 3),
          fat: 1 + ((i + mealIndex) % 2),
          carbs: 2 + ((i + mealIndex) % 2),
          fiber: (i + mealIndex) % 2,
        });
        mealsAdded += 1;
      }
    }

    dailySurveyRepository.saveSurvey({
      date: dateStr,
      weight: Number((75 + (i - 3) * 0.2).toFixed(1)),
      motivation: 'high',
      sleep: '6-8',
      stress: 'moderate',
      digestion: '1',
      water: '1-2',
      hunger: 'moderate',
      libido: 'moderate',
      comment: 'Демо-анкета',
    });
    surveysSaved += 1;
  }

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 6);
  const startDateStr = toDateString(startOfWeek);
  const endDateStr = toDateString(today);

  measurementsRepository.saveMeasurement({
    date: startDateStr,
    weight: 75.2,
    chest: 98,
    waist: 82,
    hips: 96,
    leftArm: 30,
    rightArm: 30,
    leftLeg: 54,
    rightLeg: 54,
  });

  measurementsRepository.saveMeasurement({
    date: endDateStr,
    weight: 74.6,
    chest: 97.5,
    waist: 81,
    hips: 95.5,
    leftArm: 30.2,
    rightArm: 30.1,
    leftLeg: 53.8,
    rightLeg: 53.9,
  });

  return { mealsAdded, surveysSaved };
};

export const seedWeightHistoryTwoMonths = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let surveysSaved = 0;
  let measurementsSaved = 0;

  for (let i = 0; i < 60; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - (59 - i));
    const dateStr = toDateString(date);

    const base = 89 - (8 * i) / 59;
    const wobble = Math.sin(i * 0.7) * 0.3 + Math.cos(i * 0.3) * 0.2;
    const weight = round1(clamp(base + wobble, 81, 89));

    dailySurveyRepository.saveSurvey({
      date: dateStr,
      weight,
    });
    surveysSaved += 1;

    if (i % 7 === 0) {
      const t = i / 59;
      measurementsRepository.saveMeasurement({
        date: dateStr,
        weight,
        chest: round1(102 - t * 4),
        waist: round1(92 - t * 6),
        hips: round1(100 - t * 3),
        leftArm: round1(32 - t * 1),
        rightArm: round1(32 - t * 1),
        leftLeg: round1(56 - t * 1),
        rightLeg: round1(56 - t * 1),
      });
      measurementsSaved += 1;
    }
  }

  return { surveysSaved, measurementsSaved };
};
