import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '../shared/lib/storage';
import DiaryScreen from '../features/diary/screens/DiaryScreen';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      const userRole = await AsyncStorage.getItem('userRole');
      setHasToken(!!token);
      setRole(userRole);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!hasToken) {
    return <Redirect href="/auth/login" />;
  }

  // Если клиент - показываем Дневник как главную страницу
  if (role?.toLowerCase() === 'client') {
    return <DiaryScreen />;
  }

  return <Redirect href="/(tabs)" />;
}