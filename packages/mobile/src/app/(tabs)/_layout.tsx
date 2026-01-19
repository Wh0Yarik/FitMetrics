import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BookOpen, Ruler, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TabBarVisibilityProvider, useTabBarVisibility } from '../../shared/ui';

let Updates: typeof import('expo-updates') | null = null;
try {
  Updates = require('expo-updates');
} catch {
  Updates = null;
}

const TabsContent = () => {
  const { translateY } = useTabBarVisibility();
  const insets = useSafeAreaInsets();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [pendingUpdateId, setPendingUpdateId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkUpdates = async () => {
      if (!Updates?.isEnabled) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (!mounted) return;
        if (update.isAvailable) {
          setUpdateAvailable(true);
          await Updates.fetchUpdateAsync();
          const updateId = (update.manifest as { id?: string; runtimeVersion?: string } | undefined)?.id
            ?? (update.manifest as { runtimeVersion?: string } | undefined)?.runtimeVersion
            ?? 'unknown';
          setPendingUpdateId(updateId);
          const seenKey = `updates:banner_seen:${updateId}`;
          const seen = await AsyncStorage.getItem(seenKey);
          if (!seen) {
            setBannerVisible(true);
          }
        } else {
          setUpdateAvailable(false);
        }
      } catch {
        // Ignore update errors here; profile page will still show status.
      }
    };
    checkUpdates();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDismissBanner = async () => {
    if (pendingUpdateId) {
      await AsyncStorage.setItem(`updates:banner_seen:${pendingUpdateId}`, '1');
    }
    setBannerVisible(false);
  };

  const handleApplyUpdate = async () => {
    if (pendingUpdateId) {
      await AsyncStorage.setItem(`updates:banner_seen:${pendingUpdateId}`, '1');
    }
    await Updates?.reloadAsync();
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#86EFAC', // green-300
          tabBarInactiveTintColor: '#6B7280', // gray-500
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
        <Tabs.Screen
          name="index"
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
                {updateAvailable ? <View style={styles.updateDot} /> : null}
              </View>
            ),
          }}
        />
      </Tabs>

      {bannerVisible ? (
        <View style={[styles.updateBanner, { top: Math.max(insets.top, 12) }]}>
          <View style={styles.updateBannerContent}>
            <Text style={styles.updateBannerTitle}>Доступно обновление</Text>
            <Text style={styles.updateBannerSubtitle}>Перезапусти приложение, чтобы применить</Text>
          </View>
          <TouchableOpacity style={styles.updateBannerButton} onPress={handleApplyUpdate}>
            <Text style={styles.updateBannerButtonText}>Обновить</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.updateBannerClose} onPress={handleDismissBanner}>
            <Text style={styles.updateBannerCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export default function TabLayout() {
  return (
    <TabBarVisibilityProvider>
      <TabsContent />
    </TabBarVisibilityProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  updateDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#86EFAC',
  },
  updateBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  updateBannerContent: {
    flex: 1,
  },
  updateBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  updateBannerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  updateBannerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#06B6D4',
  },
  updateBannerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  updateBannerClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBannerCloseText: {
    fontSize: 18,
    lineHeight: 18,
    color: '#6B7280',
  },
});
