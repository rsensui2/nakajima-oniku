import { describe, expect, it } from "vitest";
import { moonAge, moonElongation, moonName, previousNewMoon } from "../moon";
import { nextSpringTideStart, tideNameFromMoonAge } from "../tide-name";
import { JST_OFFSET_MS } from "../jst";

const signedDiff = (deg: number, target: number) => {
  const d = (((deg - target) % 360) + 540) % 360 - 180;
  return Math.abs(d);
};

describe("moonElongation", () => {
  it.each([
    ["2026-02-17T12:01:00Z", 0, "金環日食（新月）"],
    ["2026-03-03T11:38:00Z", 180, "皆既月食（満月）"],
    ["2026-08-12T17:37:00Z", 0, "皆既日食（新月）"],
    ["2026-08-28T04:18:00Z", 180, "部分月食（満月）"],
  ])("%s は離角 %d°（%s）", (iso, target) => {
    // 月は1時間に約0.5°進むので、0.5°以内 ≒ 1時間以内
    expect(signedDiff(moonElongation(Date.parse(iso)), target)).toBeLessThan(0.5);
  });
});

describe("previousNewMoon / moonAge", () => {
  it("2026-11-04 の直前の新月は 2026-10-10 15:49 UTC 前後", () => {
    const nm = previousNewMoon(Date.parse("2026-11-04T06:00:00Z"));
    expect(Math.abs(nm - Date.parse("2026-10-10T15:49:00Z"))).toBeLessThan(30 * 60_000);
  });

  it("新月直後の月齢は 0 に近く、負にならない", () => {
    const age = moonAge(Date.parse("2026-08-12T18:00:00Z"));
    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThan(0.1);
  });

  it("月齢から和名を返す", () => {
    expect(moonName(0.4)).toBe("新月");
    expect(moonName(14.8)).toBe("満月");
    expect(moonName(24.6)).toBe("有明月");
  });
});

describe("潮名", () => {
  it.each([
    [0.3, "大潮"],
    [5.2, "中潮"],
    [8.0, "小潮"],
    [10.4, "長潮"],
    [11.9, "若潮"],
    [15.0, "大潮"],
    [24.6, "小潮"],
    [29.3, "大潮"],
  ])("月齢 %d → %s", (age, name) => {
    expect(tideNameFromMoonAge(age)).toBe(name);
  });

  it("2026-11-04 の次の大潮は 11月9日（新月）から", () => {
    const now = Date.UTC(2026, 10, 4, 6) ;
    const start = nextSpringTideStart(now);
    expect(start).toBe(Date.UTC(2026, 10, 9) - JST_OFFSET_MS);
  });
});
