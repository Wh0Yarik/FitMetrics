import axios from 'axios';
import { Platform } from 'react-native';

// Для Android эмулятора localhost это 10.0.2.2
// Для iOS симулятора localhost это 127.0.0.1 (localhost)
// Для реального устройства нужно будет подставить IP компьютера в локальной сети
const DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
});

export const api = axios.create({
  baseURL: DEV_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;