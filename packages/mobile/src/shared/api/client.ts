import axios from 'axios';
import { Platform } from 'react-native';
import { getRefreshToken, getToken, removeRefreshToken, removeToken, setRefreshToken, setToken } from '../lib/storage';

// Определяем URL API в зависимости от платформы
// Android Emulator использует 10.0.2.2 для доступа к localhost хоста
// iOS Simulator использует localhost
// Для реального устройства нужно использовать IP вашего компьютера в локальной сети (например, 192.168.1.X)
const PROD_API_URL = 'https://api.fitmetrics.ru/api';

const isLocalUrl = (url: string) =>
  url.startsWith('http://10.0.2.2')
  || url.startsWith('http://localhost')
  || url.startsWith('http://127.0.0.1')
  || url.startsWith('http://192.168.');

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    if (!__DEV__ && isLocalUrl(envUrl)) {
      return PROD_API_URL;
    }
    return envUrl;
  }

  if (!__DEV__) {
    return PROD_API_URL;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api';
  }

  return 'http://localhost:3001/api';
};

console.log('🚀 API Client initialized with URL:', getBaseUrl());

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

// Добавляем токен к каждому запросу
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest || originalRequest._retry || status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          return null;
        }
        try {
          const response = await axios.post(`${getBaseUrl()}/auth/refresh`, { refreshToken });
          const newAccessToken = response.data.accessToken as string | undefined;
          const newRefreshToken = response.data.refreshToken as string | undefined;
          if (newAccessToken) {
            await setToken(newAccessToken);
          }
          if (newRefreshToken) {
            await setRefreshToken(newRefreshToken);
          }
          return newAccessToken ?? null;
        } catch (refreshError) {
          await removeToken();
          await removeRefreshToken();
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const token = await refreshPromise;
    if (!token) {
      return Promise.reject(error);
    }

    originalRequest.headers = {
      ...(originalRequest.headers || {}),
      Authorization: `Bearer ${token}`,
    };
    return api(originalRequest);
  }
);
