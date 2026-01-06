import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, getUserId, setUserId } from '../shared/lib/storage';
import { setCurrentUserId } from '../shared/db/userSession';
import { api } from '../shared/api/client';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      const storedUserId = await getUserId();
      const userRole = await AsyncStorage.getItem('userRole');
      if (token && !storedUserId) {
        try {
          const response = await api.get('/users/me');
          const fetchedUserId = response.data?.id;
          if (fetchedUserId) {
            await setUserId(fetchedUserId);
            setCurrentUserId(fetchedUserId);
          }
        } catch (error) {
          console.warn('Failed to restore user id:', error);
        }
      }
      setHasToken(!!token);
      setRole(userRole);
      if (storedUserId) {
        setCurrentUserId(storedUserId);
      }
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
    return <Redirect href="/auth/welcome" />;
  }

  if (role?.toLowerCase() === 'trainer') {
    return <Redirect href="/(trainer)/clients" />;
  }

  return <Redirect href="/(tabs)" />;
}
