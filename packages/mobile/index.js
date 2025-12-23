import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Ручная инициализация Expo Router для монорепозитория
export function App() {
  const ctx = require.context('./src/app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);