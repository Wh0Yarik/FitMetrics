import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder } from 'react-native';

import { getDateObj, shiftDate } from '../date';

type UseWeekCalendarParams = {
  currentDate: string;
  setCurrentDate: (dateStr: string) => void;
};

export const useWeekCalendar = ({ currentDate, setCurrentDate }: UseWeekCalendarParams) => {
  const [visibleWeekDate, setVisibleWeekDate] = useState(currentDate);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = getDateObj(currentDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  useEffect(() => {
    setVisibleWeekDate(currentDate);
  }, [currentDate]);

  const selectDate = useCallback((dateStr: string) => {
    setCurrentDate(dateStr);
    setVisibleWeekDate(dateStr);
  }, [setCurrentDate]);

  const openCalendar = useCallback(() => {
    const date = getDateObj(currentDate);
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setCalendarOpen(true);
  }, [currentDate]);

  const closeCalendar = useCallback(() => {
    setCalendarOpen(false);
  }, []);

  const monthLabel = useMemo(() => {
    const label = calendarMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [calendarMonth]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startOffset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return null;
      }
      return new Date(year, month, dayNumber);
    });
  }, [calendarMonth]);

  const handleMonthShift = useCallback((direction: number) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  }, []);

  const calendarAnim = useRef(new Animated.Value(0)).current;
  const animateCalendar = useCallback((direction: number) => {
    calendarAnim.setValue(direction * -18);
    Animated.timing(calendarAnim, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [calendarAnim]);

  const calendarPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => {
      const clamped = Math.max(-24, Math.min(24, gesture.dx * 0.35));
      calendarAnim.setValue(clamped);
    },
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < 30) {
        Animated.timing(calendarAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }).start();
        return;
      }
      const direction = gesture.dx > 0 ? -1 : 1;
      handleMonthShift(direction);
      animateCalendar(direction);
    },
  }), [animateCalendar, calendarAnim, handleMonthShift]);

  const weekSwipeAnim = useRef(new Animated.Value(0)).current;
  const handleWeekShift = useCallback((direction: number) => {
    setVisibleWeekDate((prev) => shiftDate(prev, direction * 7));
  }, []);

  const weekPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => {
      const clamped = Math.max(-28, Math.min(28, gesture.dx * 0.2));
      weekSwipeAnim.setValue(clamped);
    },
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < 40) {
        Animated.timing(weekSwipeAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }).start();
        return;
      }
      const direction = gesture.dx > 0 ? -1 : 1;
      handleWeekShift(direction);
      Animated.timing(weekSwipeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
  }), [handleWeekShift, weekSwipeAnim]);

  return {
    visibleWeekDate,
    selectDate,
    weekSwipeAnim,
    weekPanResponder,
    isCalendarOpen,
    openCalendar,
    closeCalendar,
    calendarDays,
    monthLabel,
    handleMonthShift,
    calendarAnim,
    calendarPanResponder,
  };
};
