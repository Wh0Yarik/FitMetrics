import { formatDateKey, getDateObj, getRelativeLabel, getWeekDates, getWeekStart, shiftDate } from '../src/shared/lib/date';

describe('date utils', () => {
  it('formats date keys consistently', () => {
    const date = new Date(2026, 0, 5);
    expect(formatDateKey(date)).toBe('2026-01-05');
  });

  it('parses date keys into Date', () => {
    const date = getDateObj('2026-01-05');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(5);
  });

  it('shifts date keys by days', () => {
    expect(shiftDate('2026-01-05', 2)).toBe('2026-01-07');
    expect(shiftDate('2026-01-05', -1)).toBe('2026-01-04');
  });

  it('computes week start on Monday', () => {
    const date = new Date(2026, 0, 7); // Wednesday
    const weekStart = getWeekStart(date);
    expect(formatDateKey(weekStart)).toBe('2026-01-05');
  });

  it('returns seven dates for week view', () => {
    const week = getWeekDates('2026-01-05');
    expect(week).toHaveLength(7);
    expect(formatDateKey(week[0])).toBe('2026-01-05');
    expect(formatDateKey(week[6])).toBe('2026-01-11');
  });

  it('labels today/yesterday/tomorrow', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 5));
    expect(getRelativeLabel('2026-01-05')).toBe('Сегодня');
    expect(getRelativeLabel('2026-01-04')).toBe('Вчера');
    expect(getRelativeLabel('2026-01-06')).toBe('Завтра');
    jest.useRealTimers();
  });
});
