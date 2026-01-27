import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponderInstance, PixelRatio, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

import { COLORS } from '../../constants/Colors';
import { fonts } from '../../shared/ui';

export type CalendarMarkerState = 'complete' | 'partial' | 'none';

export type CalendarWeekDay = {
  dateStr: string;
  label: string;
  day: number;
  isSelected: boolean;
  isToday: boolean;
  progress?: number;
  showProgress?: boolean;
  markerState?: CalendarMarkerState;
};

export type CalendarSyncStatus = 'syncing' | 'synced' | 'local';

type CalendarHeaderProps = {
  dateLabel: string;
  relativeLabel?: string | null;
  syncStatus?: CalendarSyncStatus;
  weekSets: CalendarWeekDay[][];
  onOpenCalendar: () => void;
  onSelectDay: (dateStr: string) => void;
  weekSwipeAnim: Animated.Value;
  weekPanHandlers: PanResponderInstance['panHandlers'];
  weekWidth: number;
  onWeekLayout: (width: number) => void;
  useSafeArea?: boolean;
};

const WeekProgressBorder = ({
  progress,
  accent,
  baseColor,
}: {
  progress: number;
  accent: string;
  baseColor: string;
}) => {
  const normalized = Math.max(0, progress);
  const baseProgress = Math.min(1, normalized);
  const overflowProgress = Math.min(1, Math.max(0, normalized - 1));
  const rectWidth = 37;
  const rectHeight = 69;
  const rectRadius = 18;
  const rectX = 0.5;
  const rectY = 0.5;
  const rectRight = rectX + rectWidth;
  const rectBottom = rectY + rectHeight;
  const rectTop = rectY;
  const rectLeft = rectX;
  const topCenterX = rectX + rectWidth / 2;
  const straightLength = 2 * (rectWidth + rectHeight - 4 * rectRadius);
  const curvedLength = 2 * Math.PI * rectRadius;
  const perimeter = straightLength + curvedLength;
  const filled = baseProgress * perimeter;
  const remaining = perimeter - filled;
  const overflowFilled = overflowProgress * perimeter;
  const overflowRemaining = perimeter - overflowFilled;
  const path = [
    `M ${topCenterX} ${rectTop}`,
    `L ${rectRight - rectRadius} ${rectTop}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectRight} ${rectTop + rectRadius}`,
    `L ${rectRight} ${rectBottom - rectRadius}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectRight - rectRadius} ${rectBottom}`,
    `L ${rectLeft + rectRadius} ${rectBottom}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectLeft} ${rectBottom - rectRadius}`,
    `L ${rectLeft} ${rectTop + rectRadius}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectLeft + rectRadius} ${rectTop}`,
    `L ${topCenterX} ${rectTop}`,
  ].join(' ');
  const accentBase = accent.startsWith('#') ? accent.slice(0, 7) : accent;
  const gradientId = `week-progress-${accentBase.replace('#', '')}`;
  const overflowColor = '#F97316';

  return (
    <Svg width="100%" height="100%" viewBox="0 0 38 70">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={accentBase} stopOpacity="0.95" />
          <Stop offset="1" stopColor={`${accentBase}66`} />
        </LinearGradient>
      </Defs>
      <Path
        d={path}
        fill="none"
        stroke={baseColor}
        strokeWidth="0.5"
      />
      <Path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeDasharray={`${filled} ${remaining}`}
        strokeDashoffset="0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {overflowProgress > 0 ? (
        <Path
          d={path}
          fill="none"
          stroke={overflowColor}
          strokeWidth="1.5"
          strokeDasharray={`${overflowFilled} ${overflowRemaining}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );
};

export const CalendarHeader = ({
  dateLabel,
  relativeLabel,
  syncStatus,
  weekSets,
  onOpenCalendar,
  onSelectDay,
  weekSwipeAnim,
  weekPanHandlers,
  weekWidth,
  onWeekLayout,
  useSafeArea = true,
}: CalendarHeaderProps) => {
  const { width } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();
  const isCompact = width <= 360 || fontScale > 1.1;
  const baseOffset = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    baseOffset.setValue(-weekWidth);
  }, [baseOffset, weekWidth]);
  const translateX = useMemo(
    () => Animated.add(weekSwipeAnim, baseOffset),
    [baseOffset, weekSwipeAnim]
  );
  const headerContent = (
    <View style={styles.headerWrapper}>
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.dateWrap}>
            <TouchableOpacity style={[styles.dateRow, isCompact && styles.dateRowCompact]} onPress={onOpenCalendar}>
              <View style={styles.dateLeft}>
                <View style={[styles.relativePill, isCompact && styles.relativePillCompact]}>
                  <Text
                    style={[styles.relativePillText, isCompact && styles.relativePillTextCompact]}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    {relativeLabel ?? dateLabel}
                    <ChevronDown size={14} color={COLORS.primary} />
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          {syncStatus ? (
            <View style={styles.syncStatus}>
              <View
                style={[
                  styles.syncBadge,
                ]}
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw size={14} color="#9CA3AF" />
                ) : syncStatus === 'synced' ? (
                  <Cloud size={14} color="#9CA3AF" />
                ) : (
                  <CloudOff size={14} color="#9CA3AF" />
                )}
              </View>
            </View>
          ) : null}
        </View>

        <View
          style={[styles.weekRow, isCompact && styles.weekRowCompact]}
          onLayout={(event) => onWeekLayout(event.nativeEvent.layout.width)}
        >
          <Animated.View
            style={[
              styles.weekTrack,
              { transform: [{ translateX }], width: weekWidth ? weekWidth * weekSets.length : undefined },
            ]}
            {...weekPanHandlers}
          >
            {weekSets.map((weekDays, index) => (
              <View key={`week-${index}`} style={[styles.weekDays, { width: weekWidth || '100%' }]}>
                {weekDays.map((day) => {
                  const showProgress = day.showProgress ?? day.isSelected;
                  const markerState = day.markerState ?? 'none';
                  return (
                    <TouchableOpacity
                      key={day.dateStr}
                      onPress={() => onSelectDay(day.dateStr)}
                      style={[
                        styles.weekDayItem,
                        isCompact && styles.weekDayItemCompact,
                        day.isSelected && styles.weekDayItemSelected,
                        day.isToday && !day.isSelected && styles.weekDayItemToday,
                      ]}
                    >
                      {showProgress && (
                        <View pointerEvents="none" style={styles.weekDayProgress}>
                          <WeekProgressBorder
                            progress={day.progress ?? 0}
                            accent={day.isSelected ? '#FFFFFF' : COLORS.primary}
                            baseColor={day.isSelected ? 'rgba(255,255,255,0.35)' : '#E5E7EB'}
                          />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.weekDayLabel,
                          isCompact && styles.weekDayLabelCompact,
                          day.isSelected && styles.weekDayLabelSelected,
                        ]}
                        allowFontScaling={false}
                      >
                        {day.label}
                      </Text>
                      <View
                        style={[
                          styles.weekDayDot,
                          isCompact && styles.weekDayDotCompact,
                          markerState === 'partial' && styles.weekDayDotPartial,
                          markerState === 'none' && styles.weekDayDotHidden,
                          day.isSelected && markerState === 'complete' && styles.weekDayDotSelected,
                          day.isSelected && markerState === 'partial' && styles.weekDayDotPartialSelected,
                        ]}
                      />
                      <Text
                        style={[
                          styles.weekDayNumber,
                          isCompact && styles.weekDayNumberCompact,
                          day.isSelected && styles.weekDayNumberSelected,
                        ]}
                        allowFontScaling={false}
                      >
                        {day.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </Animated.View>
        </View>
      </View>
    </View>
  );

  return useSafeArea ? (
    <SafeAreaView edges={['top']} style={styles.headerArea}>
      {headerContent}
    </SafeAreaView>
  ) : (
    <View style={styles.headerArea}>{headerContent}</View>
  );
};

const styles = StyleSheet.create({
  headerArea: {
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerWrapper: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 0,
  },
  headerCard: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  dateWrap: {
    flex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  dateRowCompact: {
    gap: 6,
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  relativePill: {
    backgroundColor: 'rgba(80, 202, 100, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  relativePillCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  relativePillText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: fonts.semibold,
  },
  relativePillTextCompact: {
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  dateText: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: fonts.semibold,
  },
  dateTextCompact: {
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  weekRow: {
    marginTop: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  weekRowCompact: {
    marginTop: 10,
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  weekTrack: {
    flexDirection: 'row',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
    paddingHorizontal: 6,
  },
  weekDayItem: {
    width: 38,
    height: 70,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
  },
  weekDayItemCompact: {
    width: 34,
    height: 64,
    borderRadius: 16,
  },
  weekDayProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  weekDayItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  weekDayItemToday: {
    borderColor: '#D1FAE5',
    backgroundColor: '#ECFDF3',
  },
  weekDayLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: fonts.bold,
  },
  weekDayLabelCompact: {
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  weekDayLabelSelected: {
    color: '#FFFFFF',
  },
  weekDayNumber: {
    marginTop: 2,
    fontSize: 16,
    fontFamily: fonts.light,
    color: '#111827',
  },
  weekDayNumberCompact: {
    fontSize: 13,
    fontFamily: fonts.light,
  },
  weekDayDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    marginTop: 4,
    backgroundColor: COLORS.primary,
  },
  weekDayDotCompact: {
    width: 4,
    height: 4,
  },
  weekDayDotPartial: {
    backgroundColor: '#F97316',
  },
  weekDayDotHidden: {
    opacity: 0,
  },
  weekDayDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  weekDayDotPartialSelected: {
    backgroundColor: '#FDBA74',
  },
  weekDayNumberSelected: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: '#FFFFFF',
  },
  weekDayNumberSelectedCompact: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
