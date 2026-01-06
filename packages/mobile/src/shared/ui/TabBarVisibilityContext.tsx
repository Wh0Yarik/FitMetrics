import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

const HIDE_OFFSET = 140;

type TabBarVisibilityContextValue = {
  translateY: Animated.Value;
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
};

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue | null>(null);

export const TabBarVisibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const [hidden, setHiddenState] = useState(false);

  const setHidden = useCallback(
    (nextHidden: boolean) => {
      setHiddenState(nextHidden);
      Animated.timing(translateY, {
        toValue: nextHidden ? HIDE_OFFSET : 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [translateY]
  );

  const value = useMemo(() => ({ translateY, hidden, setHidden }), [hidden, setHidden, translateY]);

  return <TabBarVisibilityContext.Provider value={value}>{children}</TabBarVisibilityContext.Provider>;
};

export const useTabBarVisibility = () => {
  const context = useContext(TabBarVisibilityContext);
  if (!context) {
    throw new Error('useTabBarVisibility must be used within TabBarVisibilityProvider');
  }
  return context;
};
