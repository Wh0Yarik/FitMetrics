import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'user_access_token';
const REFRESH_TOKEN_KEY = 'user_refresh_token';
const USER_ID_KEY = 'user_id';

/**
 * Получить токен авторизации
 */
export const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Сохранить токен авторизации
 */
export const setToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error setting refresh token:', error);
  }
};

/**
 * Удалить токен (Logout)
 */
export const removeToken = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

export const removeRefreshToken = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error removing refresh token:', error);
  }
};

/**
 * Получить id пользователя (для локальной валидации данных)
 */
export const getUserId = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(USER_ID_KEY);
    }
    return await SecureStore.getItemAsync(USER_ID_KEY);
  } catch (error) {
    console.error('Error getting user id:', error);
    return null;
  }
};

/**
 * Сохранить id пользователя
 */
export const setUserId = async (userId: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(USER_ID_KEY, userId);
    } else {
      await SecureStore.setItemAsync(USER_ID_KEY, userId);
    }
  } catch (error) {
    console.error('Error setting user id:', error);
  }
};

/**
 * Удалить id пользователя
 */
export const removeUserId = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(USER_ID_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_ID_KEY);
    }
  } catch (error) {
    console.error('Error removing user id:', error);
  }
};
