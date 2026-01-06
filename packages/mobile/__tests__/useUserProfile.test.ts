import { act, renderHook } from '@testing-library/react-native';

const mockAlert = jest.fn();
const mockApiGet = jest.fn();
const mockApiPut = jest.fn();
const mockApiPost = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: () => {},
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('../src/shared/api/client', () => ({
  api: {
    get: (...args: any[]) => mockApiGet(...args),
    put: (...args: any[]) => mockApiPut(...args),
    post: (...args: any[]) => mockApiPost(...args),
  },
}));

describe('useUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const reactNative = require('react-native');
    if (!reactNative.Alert) {
      reactNative.Alert = { alert: mockAlert };
    } else {
      reactNative.Alert.alert = mockAlert;
    }
  });

  it('blocks saving when name is empty', async () => {
    const { useUserProfile } = require('../src/features/profile/model/useUserProfile');
    const { result } = renderHook(() => useUserProfile());
    let ok = true;

    await act(async () => {
      ok = await result.current.saveProfile();
    });

    expect(ok).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith('Профиль', 'Введите имя');
  });

  it('blocks saving when telegram is invalid', async () => {
    const { useUserProfile } = require('../src/features/profile/model/useUserProfile');
    const { result } = renderHook(() => useUserProfile());
    let ok = true;

    act(() => {
      result.current.setName('Тест');
      result.current.setTelegram('test');
    });

    await act(async () => {
      ok = await result.current.saveProfile();
    });

    expect(ok).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith('Профиль', 'Telegram никнейм должен начинаться с @');
  });
});
