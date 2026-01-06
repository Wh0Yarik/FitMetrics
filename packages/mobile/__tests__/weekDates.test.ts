import { formatDateKey, getDateObj, getWeekDates, getWeekStart, shiftDate } from '../src/shared/lib/date';

describe('week date helpers', () => {
  it('shiftDate moves forward and backward', () => {
    expect(shiftDate('2026-01-05', 1)).toBe('2026-01-06');
    expect(shiftDate('2026-01-05', -1)).toBe('2026-01-04');
  });

  it('getWeekStart returns Monday start for any day in week', () => {
    const wednesday = getDateObj('2026-01-07');
    const weekStart = getWeekStart(wednesday);
    expect(weekStart.getFullYear()).toBe(2026);
    expect(weekStart.getMonth()).toBe(0);
    expect(weekStart.getDate()).toBe(5);
    expect(weekStart.getHours()).toBe(0);
    expect(weekStart.getMinutes()).toBe(0);
  });

  it('getWeekDates returns seven consecutive dates', () => {
    const dates = getWeekDates('2026-01-07');
    expect(dates).toHaveLength(7);
    expect(formatDateKey(dates[0])).toBe('2026-01-05');
    expect(formatDateKey(dates[6])).toBe('2026-01-11');
  });
});
