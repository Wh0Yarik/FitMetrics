import { getHeaderTitle, getRelativeLabel } from '../src/shared/lib/date';

describe('date helpers', () => {
  describe('getHeaderTitle', () => {
    it('formats date in ru-RU short format', () => {
      const title = getHeaderTitle('2026-01-05');
      expect(title).toBe('5 янв. 2026 г.');
    });
  });

  describe('getRelativeLabel', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 0, 5, 12, 0, 0));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('returns relative labels for today/yesterday/tomorrow', () => {
      expect(getRelativeLabel('2026-01-05')).toBe('Сегодня');
      expect(getRelativeLabel('2026-01-04')).toBe('Вчера');
      expect(getRelativeLabel('2026-01-06')).toBe('Завтра');
    });

    it('returns null for other dates', () => {
      expect(getRelativeLabel('2026-01-10')).toBeNull();
    });
  });
});
