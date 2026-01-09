import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { Card, colors, radii, shadows, spacing } from '../../../shared/ui';

const DEFAULT_HEIGHT = Math.round(Dimensions.get('window').height * 0.75);
const SHEET_ANIM = {
  inDuration: 200,
  outDuration: 200,
  inEasing: Easing.out(Easing.cubic),
  outEasing: Easing.in(Easing.cubic),
  translateInDuration: 800,
  translateOutDuration: 450,
};

type SharedBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  height?: number;
  children: React.ReactNode;
  cardStyle?: ViewStyle;
  disableBackdropPress?: boolean;
  enableSwipeToDismiss?: boolean;
};

export const SharedBottomSheet = ({
  visible,
  onClose,
  height = DEFAULT_HEIGHT,
  children,
  cardStyle,
  disableBackdropPress = false,
  enableSwipeToDismiss = true,
}: SharedBottomSheetProps) => {
  const [isMounted, setMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: SHEET_ANIM.inDuration,
          easing: SHEET_ANIM.inEasing,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: SHEET_ANIM.translateInDuration,
          easing: SHEET_ANIM.inEasing,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: SHEET_ANIM.outDuration,
        easing: SHEET_ANIM.outEasing,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: height,
        duration: SHEET_ANIM.translateOutDuration,
        easing: SHEET_ANIM.outEasing,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [backdropOpacity, height, translateY, visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          if (!enableSwipeToDismiss) return false;
          if (gesture.dy <= 4) return false;
          if (Math.abs(gesture.dx) > 10) return false;
          return true;
        },
        onPanResponderMove: (_, gesture) => {
          if (!enableSwipeToDismiss) return;
          const dy = Math.max(0, gesture.dy);
          translateY.setValue(dy);
        },
        onPanResponderRelease: (_, gesture) => {
          if (!enableSwipeToDismiss) return;
          const shouldClose = gesture.dy > height * 0.2 || gesture.vy > 1.1;
          if (shouldClose) {
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: height,
                duration: 160,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 160,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]).start(({ finished }) => {
              if (finished) {
                setMounted(false);
                onClose();
              }
            });
          } else {
            Animated.timing(translateY, {
              toValue: 0,
              duration: 200,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [backdropOpacity, enableSwipeToDismiss, height, onClose, translateY]
  );

  if (!isMounted) {
    return null;
  }

  return (
    <View style={styles.portal} pointerEvents="auto">
      <Pressable
        onPress={disableBackdropPress ? undefined : onClose}
        style={styles.backdropPressable}
      >
        <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]} />
      </Pressable>
      <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
        <Card style={[styles.card, { height }, cardStyle]}>
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.grabber} />
          </View>
          {children}
        </Card>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  portal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  container: {
    width: '100%',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    elevation: 1,
  },
  card: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: spacing.sm,
    paddingBottom: 0,
    ...shadows.sheet,
  },
  handleArea: {
    paddingTop: 0,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  grabber: {
    width: 44,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.divider,
  },
});
