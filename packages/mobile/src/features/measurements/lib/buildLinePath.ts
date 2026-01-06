export const buildLinePath = (values: Array<number | null>) => {
  const numericValues = values.filter((value): value is number => typeof value === 'number');
  if (numericValues.length < 2) return '';

  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);
  const range = maxValue - minValue || 1;

  let started = false;
  return values
    .map((value, index) => {
      if (value == null) {
        started = false;
        return '';
      }
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const normalized = (value - minValue) / range;
      const y = 100 - normalized * 100;
      const command = started ? 'L' : 'M';
      started = true;
      return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .filter(Boolean)
    .join(' ');
};
