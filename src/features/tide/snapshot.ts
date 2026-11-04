import { CUTS, type Cut, type TidePhase } from "./cuts";
import { DAY_MS, HOUR_MS, MINUTE_MS, startOfJstDay } from "./jst";
import { moonState, type MoonState } from "./moon";
import {
  findExtremes,
  sampleTide,
  tideLevelAt,
  tideRateAt,
  type TideExtreme,
  type TidePoint,
} from "./predict";
import { TOKYO_STATION } from "./station";
import { nextSpringTideStart, tideNameForDay, type TideName } from "./tide-name";

/** 満潮・干潮の前後で「満潮」「干潮」とみなす割合（半周期に対して） */
const SLACK_FRACTION = 0.2;
const SEARCH_MARGIN_MS = 14 * HOUR_MS;
const CURVE_STEP_MS = 10 * MINUTE_MS;

export type PhaseWindow = Readonly<{
  start: number;
  end: number;
  phase: TidePhase;
}>;

export type TideSnapshot = Readonly<{
  time: number;
  level: number;
  rate: number;
  phase: TidePhase;
  cut: Cut;
  previous: TideExtreme | null;
  next: TideExtreme | null;
  nextHigh: TideExtreme | null;
  nextLow: TideExtreme | null;
  /** 平均水面からの偏差を ±1 に正規化した値（3D の水面高に使う） */
  normalizedLevel: number;
  day: Readonly<{
    start: number;
    end: number;
    extremes: readonly TideExtreme[];
    /** 前後14時間を含む極値（区間の局面判定用） */
    allExtremes: readonly TideExtreme[];
    curve: readonly TidePoint[];
    windows: readonly PhaseWindow[];
    min: number;
    max: number;
  }>;
  moon: MoonState;
  tideName: TideName;
  nextSpringTide: number;
}>;

const slackPhase = (e: TideExtreme): TidePhase => (e.type === "high" ? "high" : "low");
const flowPhase = (from: TideExtreme): TidePhase => (from.type === "high" ? "ebbing" : "rising");

/** 2つの連続する極値の間を、満潮/干潮・引き/満ち・干潮/満潮の3区間に分ける */
function pairWindows(a: TideExtreme, b: TideExtreme): PhaseWindow[] {
  const span = b.time - a.time;
  const t1 = a.time + span * SLACK_FRACTION;
  const t2 = b.time - span * SLACK_FRACTION;
  return [
    { start: a.time, end: t1, phase: slackPhase(a) },
    { start: t1, end: t2, phase: flowPhase(a) },
    { start: t2, end: b.time, phase: slackPhase(b) },
  ];
}

function mergeWindows(windows: readonly PhaseWindow[]): PhaseWindow[] {
  return windows.reduce<PhaseWindow[]>((acc, w) => {
    const last = acc[acc.length - 1];
    if (last && last.phase === w.phase && Math.abs(last.end - w.start) < 1) {
      return [...acc.slice(0, -1), { ...last, end: w.end }];
    }
    return [...acc, w];
  }, []);
}

export function phaseWindows(
  extremes: readonly TideExtreme[],
  rangeStart: number,
  rangeEnd: number,
): PhaseWindow[] {
  const raw = extremes.slice(1).flatMap((b, i) => pairWindows(extremes[i], b));
  return mergeWindows(raw)
    .map((w) => ({ ...w, start: Math.max(w.start, rangeStart), end: Math.min(w.end, rangeEnd) }))
    .filter((w) => w.end > w.start);
}

export function phaseAt(ms: number, extremes: readonly TideExtreme[]): TidePhase {
  const nextIndex = extremes.findIndex((e) => e.time > ms);
  if (nextIndex <= 0) {
    return tideRateAt(ms) >= 0 ? "rising" : "ebbing";
  }
  const window = pairWindows(extremes[nextIndex - 1], extremes[nextIndex]).find(
    (w) => ms >= w.start && ms < w.end,
  );
  return window?.phase ?? (tideRateAt(ms) >= 0 ? "rising" : "ebbing");
}

export function createTideSnapshot(time: number): TideSnapshot {
  const dayStart = startOfJstDay(time);
  const dayEnd = dayStart + DAY_MS;
  const extremes = findExtremes(dayStart - SEARCH_MARGIN_MS, dayEnd + SEARCH_MARGIN_MS);
  const curve = sampleTide(dayStart, dayEnd, CURVE_STEP_MS);
  const levels = curve.map((p) => p.level);
  const level = tideLevelAt(time);
  const phase = phaseAt(time, extremes);
  const upcoming = extremes.filter((e) => e.time > time);
  const past = extremes.filter((e) => e.time <= time);

  return {
    time,
    level,
    rate: tideRateAt(time),
    phase,
    cut: CUTS[phase],
    previous: past[past.length - 1] ?? null,
    next: upcoming[0] ?? null,
    nextHigh: upcoming.find((e) => e.type === "high") ?? null,
    nextLow: upcoming.find((e) => e.type === "low") ?? null,
    normalizedLevel: Math.max(-1, Math.min(1, (level - TOKYO_STATION.meanSeaLevel) / 100)),
    day: {
      start: dayStart,
      end: dayEnd,
      extremes: extremes.filter((e) => e.time >= dayStart && e.time < dayEnd),
      allExtremes: extremes,
      curve,
      windows: phaseWindows(extremes, dayStart, dayEnd),
      min: Math.min(...levels),
      max: Math.max(...levels),
    },
    moon: moonState(time),
    tideName: tideNameForDay(time),
    nextSpringTide: nextSpringTideStart(time),
  };
}
