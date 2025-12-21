import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#4CAF50' }}>
      <Tabs.Screen name="index" options={{ title: 'Дневник', headerTitle: 'Дневник питания' }} />
    </Tabs>
  );
}