type ChartPoint = { x: number; y: number };

const format = (value: number) => value.toFixed(2);

const toCurvePath = (segment: ChartPoint[]) => {
  if (segment.length < 2) return '';
  const [start] = segment;
  const parts = [`M ${format(start.x)} ${format(start.y)}`];
  for (let i = 0; i < segment.length - 1; i += 1) {
    const p0 = i === 0 ? segment[i] : segment[i - 1];
    const p1 = segment[i];
    const p2 = segment[i + 1];
    const p3 = i + 2 < segment.length ? segment[i + 2] : p2;
    const c1 = {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    };
    const c2 = {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    };
    parts.push(
      `C ${format(c1.x)} ${format(c1.y)} ${format(c2.x)} ${format(c2.y)} ${format(p2.x)} ${format(p2.y)}`
    );
  }
  return parts.join(' ');
};

export const buildLinePath = (values: Array<number | null>) => {
  const numericValues = values.filter((value): value is number => typeof value === 'number');
  if (numericValues.length === 0) {
    return { path: '', points: [] as ChartPoint[] };
  }

  const maxIndex = Math.max(1, values.length - 1);
  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);
  const range = maxValue - minValue || 1;

  const points = values.map((value, index) => {
    if (value == null) return null;
    const x = (index / maxIndex) * 100;
    const normalized = numericValues.length === 1 ? 0.5 : (value - minValue) / range;
    const y = 100 - normalized * 100;
    return { x, y };
  });

  const segments: ChartPoint[][] = [];
  let current: ChartPoint[] = [];
  points.forEach((point) => {
    if (!point) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      return;
    }
    current.push(point);
  });
  if (current.length > 0) {
    segments.push(current);
  }

  let path = segments.map(toCurvePath).filter(Boolean).join(' ');
  if (!path && numericValues.length === 1) {
    const index = values.findIndex((value) => typeof value === 'number');
    const x = (Math.max(0, index) / maxIndex) * 100;
    const y = 50;
    const startX = Math.max(0, x - 4);
    const endX = Math.min(100, x + 4);
    path = `M ${format(startX)} ${format(y)} L ${format(endX)} ${format(y)}`;
  }
  const flatPoints = points.filter((point): point is ChartPoint => point != null);

  return { path, points: flatPoints };
};
