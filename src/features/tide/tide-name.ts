import { DAY_MS, jstNoon, startOfJstDay } from "./jst";
import { moonAge } from "./moon";

export type TideName = "大潮" | "中潮" | "小潮" | "長潮" | "若潮";

/** 月齢（整数部）→ 潮名。慣用の潮回り表による目安。 */
const TIDE_NAME_BY_AGE: readonly TideName[] = [
  "大潮", "大潮", "大潮", "中潮", "中潮", "中潮", "中潮", "小潮", "小潮", "小潮",
  "長潮", "若潮", "中潮", "中潮", "大潮", "大潮", "大潮", "大潮", "中潮", "中潮",
  "中潮", "中潮", "小潮", "小潮", "小潮", "長潮", "若潮", "中潮", "中潮", "大潮",
];

export function tideNameFromMoonAge(age: number): TideName {
  const index = Math.floor(age) % TIDE_NAME_BY_AGE.length;
  return TIDE_NAME_BY_AGE[Math.max(0, index)];
}

/** その日（JST）の潮名。正午月齢で判定する。 */
export function tideNameForDay(ms: number): TideName {
  return tideNameFromMoonAge(moonAge(jstNoon(ms)));
}

const MAX_LOOKAHEAD_DAYS = 20;

/** 次の大潮期間の初日（JST 0時）。今日が大潮なら、今の期間が終わった後の次。 */
export function nextSpringTideStart(ms: number): number {
  const today = startOfJstDay(ms);
  let inCurrentSpring = tideNameForDay(today) === "大潮";

  for (let i = 1; i <= MAX_LOOKAHEAD_DAYS; i += 1) {
    const day = today + i * DAY_MS;
    const isSpring = tideNameForDay(day) === "大潮";
    if (isSpring && !inCurrentSpring) return day;
    if (!isSpring) inCurrentSpring = false;
  }
  return today + MAX_LOOKAHEAD_DAYS * DAY_MS;
}
