import type { TidePhase } from "@/features/tide/cuts";

/** 断面輪郭のフーリエ係数の個数（a0, a1, b1, …, a6, b6） */
export const SHAPE_COEFFS = 13;

export type CutVisual = Readonly<{
  /** r(θ) = a0 + Σ ak·cos kθ + bk·sin kθ */
  shape: readonly number[];
  /** 筋束（ボロノイセル）の密度 */
  cellScale: number;
  /** 筋間脂肪の幅（物体空間） */
  seamWidth: number;
  seamAmount: number;
  /** 細かなサシの線の太さ（0–0.2） */
  threadWidth: number;
  threadAmount: number;
  threadScale: number;
  /** 中央の筋（ミスジ） */
  sinew: number;
  fatCapAngle: number;
  fatCapWidth: number;
  fatCapThickness: number;
  /** 赤身の明るさ（0: 深い赤, 1: 明るい赤） */
  leanTone: number;
}>;

const shape = (a0: number, rest: Partial<Record<string, number>>): number[] => {
  const keys = ["a1", "b1", "a2", "b2", "a3", "b3", "a4", "b4", "a5", "b5", "a6", "b6"];
  return [a0, ...keys.map((k) => rest[k] ?? 0)];
};

export const CUT_VISUALS: Readonly<Record<TidePhase, CutVisual>> = {
  rising: {
    shape: shape(0.8, { a1: 0.02, b1: -0.035, a2: 0.115, b2: 0.012, a3: -0.034, b3: 0.022, a4: 0.012, b5: 0.008 }),
    cellScale: 1.9,
    seamWidth: 0.048,
    seamAmount: 1,
    threadWidth: 0.09,
    threadAmount: 1,
    threadScale: 7.5,
    sinew: 0,
    fatCapAngle: Math.PI * 0.5,
    fatCapWidth: 0.85,
    fatCapThickness: 0.055,
    leanTone: 0.55,
  },
  high: {
    shape: shape(0.62, { a2: 0.255, a4: 0.058, a6: 0.018, b1: 0.018, b3: -0.01 }),
    cellScale: 1.5,
    seamWidth: 0.02,
    seamAmount: 0.4,
    threadWidth: 0.085,
    threadAmount: 0.95,
    threadScale: 9.5,
    sinew: 1,
    fatCapAngle: Math.PI * 0.5,
    fatCapWidth: 0.6,
    fatCapThickness: 0,
    leanTone: 0.7,
  },
  ebbing: {
    shape: shape(0.73, { a2: 0.05, a3: 0.068, b1: 0.024, b2: -0.02, a4: -0.01, b4: 0.008 }),
    cellScale: 2.2,
    seamWidth: 0.014,
    seamAmount: 0.35,
    threadWidth: 0.038,
    threadAmount: 0.55,
    threadScale: 8.5,
    sinew: 0,
    fatCapAngle: 2.1,
    fatCapWidth: 0.75,
    fatCapThickness: 0.035,
    leanTone: 0.4,
  },
  low: {
    shape: shape(0.6, { a2: 0.05, b3: 0.016, a1: 0.012, b4: 0.006 }),
    cellScale: 2.6,
    seamWidth: 0.006,
    seamAmount: 0.25,
    threadWidth: 0.03,
    threadAmount: 0.25,
    threadScale: 11,
    sinew: 0,
    fatCapAngle: Math.PI * 0.5,
    fatCapWidth: 0.5,
    fatCapThickness: 0,
    leanTone: 0.25,
  },
};

/** 毎フレーム呼ぶため、out に書き込む（描画ループでの割り当てを避ける） */
export type MutableCutVisual = { -readonly [K in keyof CutVisual]: K extends "shape" ? number[] : CutVisual[K] };

export function createMutableVisual(from: CutVisual): MutableCutVisual {
  return { ...from, shape: [...from.shape] };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function mixVisualInto(out: MutableCutVisual, a: CutVisual, b: CutVisual, t: number): MutableCutVisual {
  for (let i = 0; i < SHAPE_COEFFS; i += 1) out.shape[i] = lerp(a.shape[i], b.shape[i], t);
  out.cellScale = lerp(a.cellScale, b.cellScale, t);
  out.seamWidth = lerp(a.seamWidth, b.seamWidth, t);
  out.seamAmount = lerp(a.seamAmount, b.seamAmount, t);
  out.threadWidth = lerp(a.threadWidth, b.threadWidth, t);
  out.threadAmount = lerp(a.threadAmount, b.threadAmount, t);
  out.threadScale = lerp(a.threadScale, b.threadScale, t);
  out.sinew = lerp(a.sinew, b.sinew, t);
  out.fatCapAngle = lerp(a.fatCapAngle, b.fatCapAngle, t);
  out.fatCapWidth = lerp(a.fatCapWidth, b.fatCapWidth, t);
  out.fatCapThickness = lerp(a.fatCapThickness, b.fatCapThickness, t);
  out.leanTone = lerp(a.leanTone, b.leanTone, t);
  return out;
}
