import type { Vector3 } from "three";

export type Ease = "linear" | "inOut" | "in" | "out";
export type Vec3Tuple = readonly [number, number, number];
/** [ストーリー位置, 値, この区間（前のキー→このキー）のイージング] */
export type NumKey = readonly [at: number, value: number, ease?: Ease];
export type VecKey = readonly [at: number, value: Vec3Tuple, ease?: Ease];

const EASES: Readonly<Record<Ease, (t: number) => number>> = {
  linear: (t) => t,
  inOut: (t) => t * t * t * (t * (t * 6 - 15) + 10),
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
};

/** s を挟むキーの組（a, b）とイージング後の補間率。範囲外なら端のキーを a=b で返す。 */
type Span = { a: number; b: number; t: number };

/** 毎フレーム数十回呼ばれるので、結果は使い回しの入れ物に書く（呼び出し側はすぐ読み捨てる） */
const scratch: Span = { a: 0, b: 0, t: 0 };

export function span<T extends readonly [number, unknown, Ease?]>(keys: readonly T[], s: number, out: Span = scratch): Span {
  const last = keys.length - 1;
  if (s <= keys[0][0]) {
    out.a = 0;
    out.b = 0;
    out.t = 0;
    return out;
  }
  if (s >= keys[last][0]) {
    out.a = last;
    out.b = last;
    out.t = 0;
    return out;
  }
  let i = 1;
  while (keys[i][0] < s) i += 1;
  const start = keys[i - 1][0];
  const end = keys[i][0];
  const ease = keys[i][2] ?? "inOut";
  out.a = i - 1;
  out.b = i;
  out.t = EASES[ease]((s - start) / Math.max(end - start, 1e-6));
  return out;
}

export function evalNum(keys: readonly NumKey[], s: number): number {
  const { a, b, t } = span(keys, s);
  return keys[a][1] + (keys[b][1] - keys[a][1]) * t;
}

export function evalVec(keys: readonly VecKey[], s: number, out: Vector3): Vector3 {
  const { a, b, t } = span(keys, s);
  const va = keys[a][1];
  const vb = keys[b][1];
  return out.set(va[0] + (vb[0] - va[0]) * t, va[1] + (vb[1] - va[1]) * t, va[2] + (vb[2] - va[2]) * t);
}

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
