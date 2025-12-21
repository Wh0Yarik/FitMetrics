import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { initDatabase } from '../shared/db';
import { SyncService } from '../shared/services/sync';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Инициализируем БД при старте приложения
    initDatabase()
      .then(() => {
        console.log('Database initialized in Layout');
        setDbReady(true);
      })
      .catch((e) => console.error('DB Init Error:', e));
  }, []);

  useEffect(() => {
    if (dbReady) {
      // Пытаемся синхронизировать данные при запуске приложения
      SyncService.sync();
    }
  }, [dbReady]);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}