import type { ArgumentCoefficients, NodalKind } from "./station";

export const DEG = Math.PI / 180;
const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;
const JD_UNIX_EPOCH = 2_440_587.5;
const JD_J2000 = 2_451_545.0;

/** 天文引数の各要素の角速度（度/時） */
export const ARGUMENT_SPEEDS = {
  T: 15,
  s: 0.549_016_5,
  h: 0.041_068_6,
  p: 0.004_641_8,
  p1: 0.000_002,
} as const;

export type AstronomicalArguments = Readonly<{
  T: number;
  s: number;
  h: number;
  p: number;
  N: number;
  p1: number;
}>;

export function julianCenturies(ms: number): number {
  return (ms / MS_PER_DAY + JD_UNIX_EPOCH - JD_J2000) / 36_525;
}

/** 時刻 ms（UTC epoch）における平均天文引数（度） */
export function astronomicalArguments(ms: number): AstronomicalArguments {
  const t = julianCenturies(ms);
  const utHours = (((ms % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY) / MS_PER_HOUR;
  return {
    T: 15 * utHours + 180,
    s: 218.316_447_7 + 481_267.881_234_21 * t,
    h: 280.466_46 + 36_000.769_83 * t,
    p: 83.353_246_5 + 4_069.013_728_7 * t,
    N: 125.044_52 - 1_934.136_261 * t,
    p1: 282.94 + 1.7192 * t,
  };
}

export function equilibriumArgument(
  args: AstronomicalArguments,
  k: ArgumentCoefficients,
): number {
  return (
    (k.T ?? 0) * args.T +
    (k.s ?? 0) * args.s +
    (k.h ?? 0) * args.h +
    (k.p ?? 0) * args.p +
    (k.p1 ?? 0) * args.p1
  );
}

/** 分潮の角速度（度/時） */
export function constituentSpeed(k: ArgumentCoefficients): number {
  return (
    (k.T ?? 0) * ARGUMENT_SPEEDS.T +
    (k.s ?? 0) * ARGUMENT_SPEEDS.s +
    (k.h ?? 0) * ARGUMENT_SPEEDS.h +
    (k.p ?? 0) * ARGUMENT_SPEEDS.p +
    (k.p1 ?? 0) * ARGUMENT_SPEEDS.p1
  );
}

export type NodalFactor = Readonly<{ f: number; u: number }>;

/** Schureman の近似式による交点因数 f と交点補正角 u（度）。N は月の昇交点黄経（度）。 */
export function nodalFactor(kind: NodalKind, nodeDeg: number): NodalFactor {
  const n = nodeDeg * DEG;
  const c1 = Math.cos(n);
  const c2 = Math.cos(2 * n);
  const c3 = Math.cos(3 * n);
  const s1 = Math.sin(n);
  const s2 = Math.sin(2 * n);
  const s3 = Math.sin(3 * n);
  const m2 = { f: 1.0004 - 0.0373 * c1 + 0.0002 * c2, u: -2.14 * s1 };

  switch (kind) {
    case "M2":
      return m2;
    case "K1":
      return {
        f: 1.006 + 0.115 * c1 - 0.0088 * c2 + 0.0006 * c3,
        u: -8.86 * s1 + 0.68 * s2 - 0.07 * s3,
      };
    case "O1":
      return {
        f: 1.0089 + 0.1871 * c1 - 0.0147 * c2 + 0.0014 * c3,
        u: 10.8 * s1 - 1.34 * s2 + 0.19 * s3,
      };
    case "K2":
      return {
        f: 1.0241 + 0.2863 * c1 + 0.0083 * c2 - 0.0015 * c3,
        u: -17.74 * s1 + 0.68 * s2 - 0.04 * s3,
      };
    case "J1":
      return {
        f: 1.0129 + 0.1676 * c1 - 0.017 * c2 + 0.0016 * c3,
        u: -12.94 * s1 + 1.34 * s2 - 0.19 * s3,
      };
    case "OO1":
      return {
        f: 1.1027 + 0.6504 * c1 + 0.0317 * c2 - 0.0014 * c3,
        u: -36.68 * s1 + 4.02 * s2 - 0.57 * s3,
      };
    case "Mm":
      return { f: 1.0 - 0.13 * c1 + 0.0013 * c2, u: 0 };
    case "Mf":
      return {
        f: 1.0429 + 0.4135 * c1 - 0.004 * c2,
        u: -23.74 * s1 + 2.68 * s2 - 0.38 * s3,
      };
    case "M3":
      return { f: Math.pow(m2.f, 1.5), u: 1.5 * m2.u };
    case "M4":
      return { f: m2.f * m2.f, u: 2 * m2.u };
    case "none":
      return { f: 1, u: 0 };
  }
}
