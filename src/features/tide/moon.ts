import { DEG, julianCenturies } from "./astro";

/** 朔望月（日） */
export const SYNODIC_MONTH = 29.530_588_853;
const MS_PER_DAY = 86_400_000;
const NEW_MOON_ITERATIONS = 8;

const normalizeDegrees = (x: number) => ((x % 360) + 360) % 360;

/**
 * 月と太陽の黄経差（離角、度）。0 = 新月、180 = 満月。
 * Meeus『Astronomical Algorithms』47章の主要項。2026年の日食・月食の時刻と数分以内で一致。
 */
export function moonElongation(ms: number): number {
  const t = julianCenturies(ms);
  const lp = 218.316_447_7 + 481_267.881_234_21 * t;
  const d = (297.850_192_1 + 445_267.111_403_4 * t) * DEG;
  const m = (357.529_109_2 + 35_999.050_290_9 * t) * DEG;
  const mp = (134.963_396_4 + 477_198.867_505_5 * t) * DEG;
  const f = (93.272_095 + 483_202.017_523_3 * t) * DEG;

  const moonLongitude =
    lp +
    6.288_774 * Math.sin(mp) +
    1.274_027 * Math.sin(2 * d - mp) +
    0.658_314 * Math.sin(2 * d) +
    0.213_618 * Math.sin(2 * mp) -
    0.185_116 * Math.sin(m) -
    0.114_332 * Math.sin(2 * f) +
    0.058_793 * Math.sin(2 * d - 2 * mp) +
    0.057_066 * Math.sin(2 * d - m - mp) +
    0.053_322 * Math.sin(2 * d + mp) +
    0.045_758 * Math.sin(2 * d - m) -
    0.040_923 * Math.sin(m - mp) -
    0.034_72 * Math.sin(d) -
    0.030_383 * Math.sin(m + mp);

  const sunMean = 280.466_46 + 36_000.769_83 * t;
  const sunCenter =
    (1.914_602 - 0.004_817 * t) * Math.sin(m) +
    (0.019_993 - 0.000_101 * t) * Math.sin(2 * m) +
    0.000_289 * Math.sin(3 * m);

  return normalizeDegrees(moonLongitude - (sunMean + sunCenter));
}

/** 輝面比（0–1） */
export function moonIllumination(ms: number): number {
  return (1 - Math.cos(moonElongation(ms) * DEG)) / 2;
}

/** 直前の新月の時刻 */
export function previousNewMoon(ms: number): number {
  let t = ms - (moonElongation(ms) / 360) * SYNODIC_MONTH * MS_PER_DAY;
  for (let i = 0; i < NEW_MOON_ITERATIONS; i += 1) {
    const e = moonElongation(t);
    const signed = e > 180 ? e - 360 : e;
    t -= (signed / 360) * SYNODIC_MONTH * MS_PER_DAY;
  }
  return t > ms ? previousNewMoon(ms - MS_PER_DAY) : t;
}

/** 月齢（日）＝直前の新月からの経過日数 */
export function moonAge(ms: number): number {
  return (ms - previousNewMoon(ms)) / MS_PER_DAY;
}

const MOON_NAMES: ReadonlyArray<readonly [number, string]> = [
  [1.5, "新月"],
  [4.5, "三日月"],
  [9.5, "上弦"],
  [13.5, "十三夜"],
  [15.5, "満月"],
  [16.5, "十六夜"],
  [17.5, "立待月"],
  [18.5, "居待月"],
  [19.5, "寝待月"],
  [20.5, "更待月"],
  [24.0, "下弦"],
  [28.5, "有明月"],
  [Number.POSITIVE_INFINITY, "新月"],
];

/** 朔・上弦・望・下弦の瞬間の前後（離角 ±6° ≒ ±12時間）は、月齢ではなく離角で名前を決める */
const PRINCIPAL_PHASES: ReadonlyArray<readonly [number, string]> = [
  [0, "新月"],
  [90, "上弦"],
  [180, "満月"],
  [270, "下弦"],
  [360, "新月"],
];
const PRINCIPAL_WINDOW_DEG = 6;

export function moonName(age: number, elongation?: number): string {
  if (elongation !== undefined) {
    const principal = PRINCIPAL_PHASES.find(([deg]) => Math.abs(elongation - deg) <= PRINCIPAL_WINDOW_DEG);
    if (principal) return principal[1];
  }
  const entry = MOON_NAMES.find(([limit]) => age < limit);
  return entry ? entry[1] : "新月";
}

export type MoonState = Readonly<{
  age: number;
  elongation: number;
  illumination: number;
  waxing: boolean;
  name: string;
}>;

export function moonState(ms: number): MoonState {
  const elongation = moonElongation(ms);
  const age = moonAge(ms);
  return {
    age,
    elongation,
    illumination: (1 - Math.cos(elongation * DEG)) / 2,
    waxing: elongation < 180,
    name: moonName(age, elongation),
  };
}
