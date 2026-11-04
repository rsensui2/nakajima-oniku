import { describe, expect, it } from "vitest";
import { JST_OFFSET_MS } from "../jst";
import { findExtremes, tideLevelAt } from "../predict";

/** 気象庁 潮位表（東京 TK, 2026年）の毎時潮位（cm, 潮位表基準面上, JST 0–23時） */
const JMA_HOURLY: Record<string, number[]> = {
  "2026-01-15": [90, 111, 131, 145, 153, 151, 143, 133, 125, 124, 129, 138, 148, 154, 156, 151, 138, 118, 91, 64, 42, 31, 33, 46],
  "2026-07-20": [124, 100, 86, 83, 94, 113, 136, 155, 166, 166, 155, 137, 115, 94, 80, 77, 89, 111, 139, 165, 182, 187, 178, 160],
  "2026-11-04": [145, 145, 138, 124, 106, 88, 74, 69, 74, 89, 110, 132, 151, 163, 167, 162, 150, 134, 116, 102, 95, 96, 107, 123],
};

const jst = (date: string, hour = 0, minute = 0) => {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d, hour, minute) - JST_OFFSET_MS;
};

describe("tideLevelAt（東京・調和定数25分潮）", () => {
  for (const [date, hourly] of Object.entries(JMA_HOURLY)) {
    it(`${date} の毎時潮位が気象庁予測と 7cm 以内で一致する`, () => {
      const errors = hourly.map((expected, hour) => tideLevelAt(jst(date, hour)) - expected);
      const rms = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
      expect(Math.max(...errors.map(Math.abs))).toBeLessThan(7);
      expect(rms).toBeLessThan(3);
    });
  }
});

describe("findExtremes", () => {
  it("2026-11-04 の満潮・干潮の時刻が気象庁潮位表と 15 分以内で一致する", () => {
    const start = jst("2026-11-04");
    const extremes = findExtremes(start, start + 86_400_000);
    const expected = [
      { type: "high", time: jst("2026-11-04", 0, 31), level: 146 },
      { type: "low", time: jst("2026-11-04", 7, 0), level: 69 },
      { type: "high", time: jst("2026-11-04", 13, 56), level: 167 },
      { type: "low", time: jst("2026-11-04", 20, 18), level: 94 },
    ];
    expect(extremes.map((e) => e.type)).toEqual(expected.map((e) => e.type));
    extremes.forEach((e, i) => {
      expect(Math.abs(e.time - expected[i].time)).toBeLessThan(15 * 60_000);
      expect(Math.abs(e.level - expected[i].level)).toBeLessThan(6);
    });
  });
});
