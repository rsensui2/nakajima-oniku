"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./use-media-query";

/** 0 から target まで数字を数え上げる（start が true になってから） */
export function useCountUp(target: number, durationMs: number, start: boolean): number {
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!start || reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs);
      setValue(target * (1 - Math.pow(1 - t, 4)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start, reduced]);
  return reduced ? target : value;
}
