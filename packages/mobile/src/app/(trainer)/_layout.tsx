import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { BookOpen, Ruler, User, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarVisibilityProvider, useTabBarVisibility } from '../../shared/ui';

const TabsContent = () => {
  const { translateY } = useTabBarVisibility();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="clients"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#86EFAC',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: Math.max(insets.bottom, 12),
          marginHorizontal: 24,
          height: 64,
          paddingTop: 10,
          paddingBottom: 10,
          paddingHorizontal: 8,
          backgroundColor: '#111827',
          borderRadius: 24,
          borderTopWidth: 0,
          shadowColor: '#0F172A',
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
          transform: [{ translateY }],
        },
        tabBarItemStyle: {
          marginVertical: 6,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="clients"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-2xl ${focused ? 'bg-gray-800' : ''}`}>
              <Users size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-2xl ${focused ? 'bg-gray-800' : ''}`}>
              <BookOpen size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="measurements"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-2xl ${focused ? 'bg-gray-800' : ''}`}>
              <Ruler size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-2xl ${focused ? 'bg-gray-800' : ''}`}>
              <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="client/[id]" options={{ href: null }} />
    </Tabs>
  );
};

export default function TrainerLayout() {
  return (
    <TabBarVisibilityProvider>
      <TabsContent />
    </TabBarVisibilityProvider>
  );
}
