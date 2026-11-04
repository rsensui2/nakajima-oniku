/** 日本標準時（UTC+9、夏時間なし）の日付計算 */

export const JST_OFFSET_MS = 9 * 3_600_000;
export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;
export const MINUTE_MS = 60_000;

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type JstParts = Readonly<{
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: (typeof WEEKDAYS)[number];
}>;

export function startOfJstDay(ms: number): number {
  return Math.floor((ms + JST_OFFSET_MS) / DAY_MS) * DAY_MS - JST_OFFSET_MS;
}

export function jstNoon(ms: number): number {
  return startOfJstDay(ms) + 12 * HOUR_MS;
}

export function jstParts(ms: number): JstParts {
  const d = new Date(ms + JST_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    weekday: WEEKDAYS[d.getUTCDay()],
  };
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatJstTime(ms: number): string {
  const { hour, minute } = jstParts(ms);
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function formatJstDate(ms: number): string {
  const { month, day, weekday } = jstParts(ms);
  return `${month}月${day}日（${weekday}）`;
}

export function formatJstDot(ms: number): string {
  const { year, month, day } = jstParts(ms);
  return `${year}.${pad2(month)}.${pad2(day)}`;
}

/** 時刻を JST の「その日の 0–24 時」に対する比率に変換 */
export function jstDayFraction(ms: number): number {
  return (ms - startOfJstDay(ms)) / DAY_MS;
}
