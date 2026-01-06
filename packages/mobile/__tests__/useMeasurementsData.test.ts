import { renderHook, waitFor } from '@testing-library/react-native';

import { useMeasurementsData } from '../src/features/measurements/model/useMeasurementsData';

const mockGetAllMeasurements = jest.fn();
const mockUpsertFromServer = jest.fn();
const mockGetSurveyByDate = jest.fn();
const mockApiGet = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => callback(), [callback]);
    },
  };
});

jest.mock('../src/features/measurements/repositories/MeasurementsRepository', () => ({
  measurementsRepository: {
    getAllMeasurements: (...args: any[]) => mockGetAllMeasurements(...args),
    upsertFromServer: (...args: any[]) => mockUpsertFromServer(...args),
  },
}));

jest.mock('../src/features/diary/repositories/DailySurveyRepository', () => ({
  dailySurveyRepository: {
    getSurveyByDate: (...args: any[]) => mockGetSurveyByDate(...args),
  },
}));

jest.mock('../src/shared/api/client', () => ({
  api: {
    get: (...args: any[]) => mockApiGet(...args),
  },
}));

describe('useMeasurementsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enriches measurements with survey weight', async () => {
    mockGetAllMeasurements.mockReturnValue([
      {
        id: 'm1',
        date: '2026-01-05',
        weight: null,
        chest: null,
        waist: null,
        hips: null,
        leftArm: null,
        rightArm: null,
        leftLeg: null,
        rightLeg: null,
        photoFront: null,
        photoSide: null,
        photoBack: null,
        synced: true,
        createdAt: '2026-01-05T10:00:00.000Z',
      },
    ]);
    mockGetSurveyByDate.mockImplementation((date: string) => (
      date === '2026-01-05' ? { weight: 72 } : null
    ));
    mockApiGet.mockResolvedValue({ data: [] });
    const setSyncStatus = jest.fn();

    const { result } = renderHook(() => useMeasurementsData({
      currentDate: '2026-01-05',
      setSyncStatus,
    }));

    await waitFor(() => {
      expect(result.current.measurements[0]?.weight).toBe(72);
    });
    await waitFor(() => {
      expect(setSyncStatus).toHaveBeenCalledWith('synced');
    });
  });

  it('syncs measurements from server', async () => {
    mockGetAllMeasurements.mockReturnValue([]);
    mockGetSurveyByDate.mockReturnValue(null);
    mockApiGet.mockResolvedValue({
      data: [
        {
          id: 'srv1',
          date: '2026-01-06T00:00:00.000Z',
          chest: 90,
          waist: 70,
          hips: 95,
          arms: 30,
          legs: 55,
          photoFront: 'front.jpg',
          photoSide: 'side.jpg',
          photoBack: 'back.jpg',
        },
      ],
    });
    const setSyncStatus = jest.fn();

    renderHook(() => useMeasurementsData({
      currentDate: '2026-01-06',
      setSyncStatus,
    }));

    await waitFor(() => {
      expect(mockUpsertFromServer).toHaveBeenCalledWith({
        id: 'srv1',
        date: '2026-01-06',
        chest: 90,
        waist: 70,
        hips: 95,
        leftArm: 30,
        rightArm: 30,
        leftLeg: 55,
        rightLeg: 55,
        photoFront: 'front.jpg',
        photoSide: 'side.jpg',
        photoBack: 'back.jpg',
      });
    });
  });
});
