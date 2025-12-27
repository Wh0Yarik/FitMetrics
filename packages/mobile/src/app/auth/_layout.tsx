import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
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