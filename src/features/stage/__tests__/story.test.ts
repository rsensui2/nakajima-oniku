import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { storyFromScroll } from "@/features/home/scroll/use-story-scroll";
import { evalNum, evalVec, span, type NumKey } from "../tracks";

describe("storyFromScroll", () => {
  // hero(0–1000) と tide(1100–3100) の間に 100px のテロップがある配置
  const sections = [
    { top: 0, height: 1000 },
    { top: 1100, height: 2000 },
    { top: 3100, height: 1000 },
  ];

  it("セクション内では 番号 + 進み を返す", () => {
    expect(storyFromScroll(0, sections)).toBe(0);
    expect(storyFromScroll(500, sections)).toBeCloseTo(0.5);
    expect(storyFromScroll(2100, sections)).toBeCloseTo(1.5);
  });

  it("セクションの間（テロップの上）でも S は後戻りしない", () => {
    const ys = Array.from({ length: 80 }, (_, i) => 900 + i * 5);
    const ss = ys.map((y) => storyFromScroll(y, sections));
    ss.slice(1).forEach((s, i) => expect(s).toBeGreaterThanOrEqual(ss[i]));
    expect(storyFromScroll(1050, sections)).toBe(1);
  });

  it("最後のセクションより下はセクション数で止まる", () => {
    expect(storyFromScroll(99_999, sections)).toBe(3);
  });
});

describe("tracks", () => {
  const keys: readonly NumKey[] = [
    [1, 0],
    [2, 10, "linear"],
    [3, 10],
  ];

  it("範囲の外では端の値を返す", () => {
    expect(evalNum(keys, -5)).toBe(0);
    expect(evalNum(keys, 1)).toBe(0);
    expect(evalNum(keys, 3)).toBe(10);
    expect(evalNum(keys, 9)).toBe(10);
  });

  it("区間の中ではその区間のイージングで補間する", () => {
    expect(evalNum(keys, 1.5)).toBeCloseTo(5);
    expect(evalNum(keys, 2.5)).toBeCloseTo(10);
  });

  it("キーの時刻ちょうどでは、そのキーの値になる", () => {
    expect(evalNum(keys, 2)).toBeCloseTo(10);
    const s = span(keys, 2);
    expect(s.b).toBe(1);
    expect(s.t).toBeCloseTo(1);
  });

  it("ベクトルも同じ規則で補間する", () => {
    const out = evalVec(
      [
        [0, [0, 0, 0]],
        [1, [2, 4, 6], "linear"],
      ],
      0.5,
      new Vector3(),
    );
    expect(out.toArray()).toEqual([1, 2, 3]);
  });
});
