import { describe, expect, it } from "vitest";
import { JST_OFFSET_MS } from "../jst";
import { createTideSnapshot } from "../snapshot";

const jst = (hour: number, minute = 0) => Date.UTC(2026, 10, 4, hour, minute) - JST_OFFSET_MS;

describe("createTideSnapshot（2026-11-04 東京）", () => {
  it.each([
    [jst(0, 40), "high", "ミスジ"],
    [jst(4, 0), "ebbing", "ランプ"],
    [jst(7, 10), "low", "ヒレ"],
    [jst(10, 30), "rising", "肩ロース"],
    [jst(13, 50), "high", "ミスジ"],
    [jst(17, 0), "ebbing", "ランプ"],
  ])("時刻ごとに潮の局面と部位が決まる", (time, phase, cutName) => {
    const s = createTideSnapshot(time);
    expect(s.phase).toBe(phase);
    expect(s.cut.name).toBe(cutName);
  });

  it("その日の局面の区間は 0時〜24時を隙間なく覆う", () => {
    const s = createTideSnapshot(jst(12));
    const { windows, start, end } = s.day;
    expect(windows[0].start).toBe(start);
    expect(windows[windows.length - 1].end).toBe(end);
    windows.slice(1).forEach((w, i) => {
      expect(w.start).toBeCloseTo(windows[i].end, 0);
      expect(w.phase).not.toBe(windows[i].phase);
    });
  });

  it("次の満潮・干潮と潮名・月齢を持つ", () => {
    const s = createTideSnapshot(jst(15));
    expect(s.nextLow?.type).toBe("low");
    expect(s.nextHigh?.type).toBe("high");
    expect(s.tideName).toBe("小潮");
    expect(s.moon.waxing).toBe(false);
    expect(s.moon.age).toBeGreaterThan(24);
    expect(s.day.extremes).toHaveLength(4);
  });
});
