import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponderInstance } from 'react-native';
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
  weekDays: CalendarWeekDay[];
  onOpenCalendar: () => void;
  onSelectDay: (dateStr: string) => void;
  weekSwipeAnim: Animated.Value;
  weekPanHandlers: PanResponderInstance['panHandlers'];
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
        strokeWidth="2"
      />
      <Path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
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
          strokeWidth="2"
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
  weekDays,
  onOpenCalendar,
  onSelectDay,
  weekSwipeAnim,
  weekPanHandlers,
  useSafeArea = true,
}: CalendarHeaderProps) => {
  const headerContent = (
    <View className="px-6 pb-0 pt-2">
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View>
            <TouchableOpacity style={styles.dateRow} onPress={onOpenCalendar}>
              <View style={styles.dateLeft}>
                {relativeLabel ? (
                  <View style={styles.relativePill}>
                    <Text style={styles.relativePillText}>{relativeLabel}</Text>
                  </View>
                ) : null}
                <Text style={styles.dateText}>{dateLabel}</Text>
              </View>
              <ChevronDown size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {syncStatus ? (
            <View style={styles.syncStatus}>
              <View
                style={[
                  styles.syncBadge,
                  syncStatus === 'synced' && styles.syncBadgeSuccess,
                  syncStatus === 'local' && styles.syncBadgeLocal,
                ]}
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw size={14} color="#6B7280" />
                ) : syncStatus === 'synced' ? (
                  <Cloud size={14} color="#10B981" />
                ) : (
                  <CloudOff size={14} color="#F97316" />
                )}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.weekRow}>
          <Animated.View
            style={[styles.weekDays, { transform: [{ translateX: weekSwipeAnim }] }]}
            {...weekPanHandlers}
          >
            {weekDays.map((day) => {
              const showProgress = day.showProgress ?? day.isSelected;
              const markerState = day.markerState ?? 'none';
              return (
                <TouchableOpacity
                  key={day.dateStr}
                  onPress={() => onSelectDay(day.dateStr)}
                  style={[
                    styles.weekDayItem,
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
                  <Text style={[styles.weekDayLabel, day.isSelected && styles.weekDayLabelSelected]}>
                    {day.label}
                  </Text>
                  <View
                    style={[
                      styles.weekDayDot,
                      markerState === 'partial' && styles.weekDayDotPartial,
                      markerState === 'none' && styles.weekDayDotHidden,
                      day.isSelected && markerState === 'complete' && styles.weekDayDotSelected,
                      day.isSelected && markerState === 'partial' && styles.weekDayDotPartialSelected,
                    ]}
                  />
                  {day.isSelected ? (
                    <View style={styles.weekDayNumberPill}>
                      <Text style={styles.weekDayNumberSelected}>{day.day}</Text>
                    </View>
                  ) : (
                    <Text style={styles.weekDayNumber}>{day.day}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
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
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relativePill: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  relativePillText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: fonts.semibold,
  },
  dateText: {
    color: '#111827',
    fontSize: 18,
    fontFamily: fonts.semibold,
    paddingVertical: 4,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  syncBadgeSuccess: {
    backgroundColor: '#ECFDF3',
  },
  syncBadgeLocal: {
    backgroundColor: '#FFF7ED',
  },
  weekRow: {
    marginTop: 12,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  weekDayItem: {
    width: 38,
    height: 70,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
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
    fontFamily: fonts.semibold,
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
  weekDayDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginTop: 4,
    backgroundColor: COLORS.primary,
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
  weekDayNumberPill: {
    marginTop: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayNumberSelected: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: COLORS.primary,
  },
});
