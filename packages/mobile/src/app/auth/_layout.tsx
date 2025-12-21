import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Назад',
      }}
    >
      <Stack.Screen 
        name="register-trainer" 
        options={{ title: 'Регистрация тренера' }} 
      />
      <Stack.Screen 
        name="register-client" 
        options={{ title: 'Регистрация клиента' }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ title: 'Вход' }} 
      />
    </Stack>
  );
}