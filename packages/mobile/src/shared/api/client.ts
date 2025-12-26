import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../lib/storage';

// Определяем URL API в зависимости от платформы
// Android Emulator использует 10.0.2.2 для доступа к localhost хоста
// iOS Simulator использует localhost
// Для реального устройства нужно использовать IP вашего компьютера в локальной сети (например, 192.168.1.X)
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
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

// Добавляем токен к каждому запросу
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});