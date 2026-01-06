export const getDateObj = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const shiftDate = (dateStr: string, days: number) => {
  const date = getDateObj(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
};

export const getWeekStart = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const getWeekDates = (currentDate: string) => {
  const base = getWeekStart(getDateObj(currentDate));
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    days.push(day);
  }
  return days;
};

export const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const getHeaderTitle = (currentDate: string) => {
  const current = getDateObj(currentDate);
  return current.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getRelativeLabel = (currentDate: string) => {
  const current = getDateObj(currentDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (current.getTime() === now.getTime()) return 'Сегодня';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (current.getTime() === yesterday.getTime()) return 'Вчера';
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (current.getTime() === tomorrow.getTime()) return 'Завтра';
  return null;
};
