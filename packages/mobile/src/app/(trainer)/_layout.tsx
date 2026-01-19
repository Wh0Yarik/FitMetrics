import { Tabs, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BookOpen, Ruler, User, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const pathname = usePathname();
  const wasOnProfile = useRef(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  const checkUpdates = async () => {
    if (!Updates?.isEnabled) return false;
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setUpdateAvailable(true);
        await Updates.fetchUpdateAsync();
        return true;
      }
      setUpdateAvailable(false);
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (__DEV__) {
      setUpdateAvailable(true);
      setBannerVisible(true);
      return;
    }
    let mounted = true;
    checkUpdates().then((available) => {
      if (available && mounted) {
        setBannerVisible(true);
      }
    }).catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const isProfile = pathname?.includes('/profile');
    if (!isProfile) {
      wasOnProfile.current = false;
      return;
    }
    if (wasOnProfile.current) return;
    wasOnProfile.current = true;
    if (__DEV__) {
      setUpdateAvailable(true);
      setBannerVisible(true);
      return;
    }
    if (updateAvailable) {
      setBannerVisible(true);
      return;
    }
    checkUpdates().then((available) => {
      if (available) setBannerVisible(true);
    });
  }, [pathname, updateAvailable]);

  const handleDismissBanner = () => {
    setBannerVisible(false);
  };

  const handleApplyUpdate = async () => {
    await Updates?.reloadAsync();
  };

  return (
    <View style={styles.container}>
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
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Users size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="diary"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <BookOpen size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="measurements"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ruler size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
                {updateAvailable ? <View style={styles.updateDot} /> : null}
              </View>
            ),
          }}
        />
        <Tabs.Screen name="client/[id]" options={{ href: null }} />
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

export default function TrainerLayout() {
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
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapperActive: {
    backgroundColor: '#1F2937',
  },
  updateDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#111827',
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
    zIndex: 10,
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
