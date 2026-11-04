import {
  DEG,
  astronomicalArguments,
  constituentSpeed,
  equilibriumArgument,
  nodalFactor,
} from "./astro";
import { TOKYO_STATION, type TideStation } from "./station";

export type TideExtremeType = "high" | "low";

export type TideExtreme = Readonly<{
  type: TideExtremeType;
  time: number;
  level: number;
}>;

export type TidePoint = Readonly<{ time: number; level: number }>;

const MS_PER_HOUR = 3_600_000;
const SCAN_STEP_MS = 10 * 60_000;
const BISECT_ITERATIONS = 24;
/** これより小さい上下（cm）は満潮・干潮として数えない（日周不等で出る小さな揺れ） */
export const MIN_EXTREME_RANGE_CM = 3;

type Term = Readonly<{ amplitude: number; argument: number; speed: number }>;

function terms(ms: number, station: TideStation): Term[] {
  const args = astronomicalArguments(ms);
  return station.constituents.map((con) => {
    const { f, u } = nodalFactor(con.nodal, args.N);
    const argument =
      equilibriumArgument(args, con.coefficients) +
      con.phaseOffset +
      con.species * station.longitude +
      u -
      con.kappa;
    return {
      amplitude: f * con.amplitude,
      argument: argument * DEG,
      speed: constituentSpeed(con.coefficients) * DEG,
    };
  });
}

/** 潮位（cm、潮位表基準面上） */
export function tideLevelAt(ms: number, station: TideStation = TOKYO_STATION): number {
  return terms(ms, station).reduce(
    (sum, term) => sum + term.amplitude * Math.cos(term.argument),
    station.meanSeaLevel,
  );
}

/** 潮位の変化率（cm/時）。正なら上げ潮。 */
export function tideRateAt(ms: number, station: TideStation = TOKYO_STATION): number {
  return terms(ms, station).reduce(
    (sum, term) => sum - term.amplitude * term.speed * Math.sin(term.argument),
    0,
  );
}

function refineExtreme(a: number, b: number, station: TideStation): number {
  let lo = a;
  let hi = b;
  const rateLo = tideRateAt(lo, station);
  for (let i = 0; i < BISECT_ITERATIONS; i += 1) {
    const mid = (lo + hi) / 2;
    const rateMid = tideRateAt(mid, station);
    if (Math.sign(rateMid) === Math.sign(rateLo)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/** 隣り合う満潮と干潮の差が小さすぎる組を取り除く（取り除いた後も満干は交互に並ぶ） */
export function dropTinyExtremes(extremes: readonly TideExtreme[], minRange = MIN_EXTREME_RANGE_CM): TideExtreme[] {
  const index = extremes.findIndex(
    (e, i) => i < extremes.length - 1 && Math.abs(e.level - extremes[i + 1].level) < minRange,
  );
  if (index === -1) return [...extremes];
  return dropTinyExtremes([...extremes.slice(0, index), ...extremes.slice(index + 2)], minRange);
}

/** [startMs, endMs) の満潮・干潮を時刻順に返す */
export function findExtremes(
  startMs: number,
  endMs: number,
  station: TideStation = TOKYO_STATION,
): TideExtreme[] {
  const extremes: TideExtreme[] = [];
  let prevTime = startMs;
  let prevRate = tideRateAt(prevTime, station);

  for (let t = startMs + SCAN_STEP_MS; t <= endMs + SCAN_STEP_MS; t += SCAN_STEP_MS) {
    const rate = tideRateAt(t, station);
    if (prevRate !== 0 && Math.sign(rate) !== Math.sign(prevRate)) {
      const time = refineExtreme(prevTime, t, station);
      if (time >= startMs && time < endMs) {
        extremes.push({
          type: prevRate > 0 ? "high" : "low",
          time,
          level: tideLevelAt(time, station),
        });
      }
    }
    prevTime = t;
    prevRate = rate;
  }
  return dropTinyExtremes(extremes);
}

export function sampleTide(
  startMs: number,
  endMs: number,
  stepMs: number,
  station: TideStation = TOKYO_STATION,
): TidePoint[] {
  const count = Math.floor((endMs - startMs) / stepMs) + 1;
  return Array.from({ length: count }, (_, i) => {
    const time = startMs + i * stepMs;
    return { time, level: tideLevelAt(time, station) };
  });
}

export const HOUR_MS = MS_PER_HOUR;
