import { buildLinePath } from '../src/features/measurements/lib/buildLinePath';

describe('buildLinePath', () => {
  it('returns empty string when no numeric values', () => {
    expect(buildLinePath([null, null])).toBe('');
    expect(buildLinePath([1])).toBe('');
  });

  it('builds a path for numeric series', () => {
    const path = buildLinePath([1, 2, 3]);
    expect(path.startsWith('M ')).toBe(true);
    expect(path.includes('L ')).toBe(true);
  });

  it('skips null values but keeps segments', () => {
    const path = buildLinePath([null, 1, 2, null, 3]);
    expect(path).toContain('M ');
  });
});
