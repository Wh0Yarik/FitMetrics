import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useDiarySync } from '../src/features/diary/model/useDiarySync';
import { shiftDate } from '../src/shared/lib/date';

const mockGetMealsByDate = jest.fn();
const mockMarkMealsAsSynced = jest.fn();
const mockHasUnsyncedMeals = jest.fn();
const mockReplaceMealsFromServer = jest.fn();
const mockGetSurveyByDate = jest.fn();
const mockMarkSurveyAsSynced = jest.fn();
const mockHasUnsyncedSurvey = jest.fn();
const mockUpsertFromServer = jest.fn();
const mockApiPost = jest.fn();
const mockApiGet = jest.fn();
const mockGetToken = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => callback(), [callback]);
    },
  };
});

jest.mock('../src/features/diary/repositories/DiaryRepository', () => ({
  diaryRepository: {
    getMealsByDate: (...args: any[]) => mockGetMealsByDate(...args),
    markMealsAsSynced: (...args: any[]) => mockMarkMealsAsSynced(...args),
    hasUnsyncedMeals: (...args: any[]) => mockHasUnsyncedMeals(...args),
    replaceMealsFromServer: (...args: any[]) => mockReplaceMealsFromServer(...args),
  },
}));

jest.mock('../src/features/diary/repositories/DailySurveyRepository', () => ({
  dailySurveyRepository: {
    getSurveyByDate: (...args: any[]) => mockGetSurveyByDate(...args),
    markSurveyAsSynced: (...args: any[]) => mockMarkSurveyAsSynced(...args),
    hasUnsyncedSurvey: (...args: any[]) => mockHasUnsyncedSurvey(...args),
    upsertFromServer: (...args: any[]) => mockUpsertFromServer(...args),
  },
}));

jest.mock('../src/shared/api/client', () => ({
  api: {
    post: (...args: any[]) => mockApiPost(...args),
    get: (...args: any[]) => mockApiGet(...args),
  },
}));

jest.mock('../src/shared/lib/storage', () => ({
  getToken: () => mockGetToken(),
}));

describe('useDiarySync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncDiaryForDate posts meals and marks them as synced', async () => {
    mockGetToken.mockResolvedValue('token');
    mockGetMealsByDate.mockReturnValue([
      {
        name: 'Завтрак',
        time: '2026-01-06T08:00:00.000Z',
        portions: { protein: 1, fat: 2, carbs: 3, fiber: 4 },
      },
    ]);
    const setSyncStatus = jest.fn();
    const refreshData = jest.fn();

    const { result } = renderHook(() => useDiarySync({
      currentDate: '2026-01-06',
      syncStatus: 'synced',
      setSyncStatus,
      refreshData,
    }));

    await act(async () => {
      await result.current.syncDiaryForDate(true);
    });

    expect(mockApiPost).toHaveBeenCalledWith('/diary/entries', {
      date: '2026-01-06',
      meals: [
        { name: 'Завтрак', time: '2026-01-06T08:00:00.000Z', protein: 1, fat: 2, carbs: 3, fiber: 4 },
      ],
    });
    expect(mockMarkMealsAsSynced).toHaveBeenCalledWith('2026-01-06');
    expect(setSyncStatus).toHaveBeenCalledWith('synced');
    expect(refreshData).toHaveBeenCalled();
  });

  it('syncSurveyForDate posts survey data and marks it as synced', async () => {
    mockGetToken.mockResolvedValue('token');
    mockGetSurveyByDate.mockReturnValue({
      synced: false,
      weight: 70,
      motivation: 4,
      sleep: 7,
      stress: 2,
      digestion: 3,
      water: 2,
      hunger: 3,
      libido: 4,
      comment: 'ok',
    });
    const setSyncStatus = jest.fn();
    const refreshData = jest.fn();

    const { result } = renderHook(() => useDiarySync({
      currentDate: '2026-01-06',
      syncStatus: 'synced',
      setSyncStatus,
      refreshData,
    }));

    await act(async () => {
      await result.current.syncSurveyForDate(true);
    });

    expect(mockApiPost).toHaveBeenCalledWith('/surveys/entries', {
      date: '2026-01-06',
      weight: 70,
      motivation: 4,
      sleep: 7,
      stress: 2,
      digestion: 3,
      water: 2,
      hunger: 3,
      libido: 4,
      comment: 'ok',
    });
    expect(mockMarkSurveyAsSynced).toHaveBeenCalledWith('2026-01-06');
    expect(refreshData).toHaveBeenCalled();
  });

  it('syncDiaryFromServer replaces meals from API data', async () => {
    mockGetToken.mockResolvedValue('token');
    mockApiGet.mockResolvedValue({
      data: [
        {
          date: '2026-01-05',
          meals: [
            { name: 'Ужин', time: '2026-01-05T19:00:00.000Z', protein: 1, fat: 1, carbs: 1, fiber: 1 },
          ],
        },
      ],
    });
    const setSyncStatus = jest.fn();
    const refreshData = jest.fn();

    const { result } = renderHook(() => useDiarySync({
      currentDate: '2026-01-06',
      syncStatus: 'synced',
      setSyncStatus,
      refreshData,
    }));

    await act(async () => {
      await result.current.syncDiaryFromServer(true);
    });

    const from = shiftDate('2026-01-06', -90);
    expect(mockApiGet).toHaveBeenCalledWith('/diary/entries', { params: { from } });
    await waitFor(() => {
      expect(mockReplaceMealsFromServer).toHaveBeenCalledWith('2026-01-05', [
        { name: 'Ужин', time: '2026-01-05T19:00:00.000Z', protein: 1, fat: 1, carbs: 1, fiber: 1 },
      ]);
    });
    expect(refreshData).toHaveBeenCalled();
  });

  it('syncSurveysFromServer upserts survey data', async () => {
    mockApiGet.mockResolvedValue({
      data: [
        {
          date: '2026-01-05',
          weight: 70,
          motivation: 4,
          sleep: 7,
          stress: 2,
          digestion: 3,
          water: 2,
          hunger: 3,
          libido: 4,
          comment: 'ok',
        },
      ],
    });
    const setSyncStatus = jest.fn();
    const refreshData = jest.fn();

    const { result } = renderHook(() => useDiarySync({
      currentDate: '2026-01-06',
      syncStatus: 'synced',
      setSyncStatus,
      refreshData,
    }));

    await act(async () => {
      await result.current.syncSurveysFromServer(true);
    });

    await waitFor(() => {
      expect(mockUpsertFromServer).toHaveBeenCalledWith({
        date: '2026-01-05',
        weight: 70,
        motivation: 4,
        sleep: 7,
        stress: 2,
        digestion: 3,
        water: 2,
        hunger: 3,
        libido: 4,
        comment: 'ok',
        synced: true,
      });
    });
    expect(refreshData).toHaveBeenCalled();
  });
});
