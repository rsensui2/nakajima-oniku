"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DAY_MS } from "@/features/tide/jst";
import { createTideSnapshot, type TideSnapshot } from "@/features/tide/snapshot";

const REFRESH_MS = 20_000;
export const DATE_OFFSET_MIN = -7;
export const DATE_OFFSET_MAX = 21;

type TideContextValue = Readonly<{
  snapshot: TideSnapshot | null;
  offsetDays: number;
  setOffsetDays: (days: number) => void;
}>;

const TideContext = createContext<TideContextValue | null>(null);

/** 現在時刻（＋日付ずらし）の潮と月を計算して配る。描画時には時刻に触れない。 */
export function TideProvider({ children }: { children: React.ReactNode }) {
  const [offsetDays, setOffsetDaysRaw] = useState(0);
  const [snapshot, setSnapshot] = useState<TideSnapshot | null>(null);

  useEffect(() => {
    const update = () => setSnapshot(createTideSnapshot(Date.now() + offsetDays * DAY_MS));
    update();
    const id = window.setInterval(update, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [offsetDays]);

  const value = useMemo<TideContextValue>(
    () => ({
      snapshot,
      offsetDays,
      setOffsetDays: (days) =>
        setOffsetDaysRaw(Math.round(Math.min(DATE_OFFSET_MAX, Math.max(DATE_OFFSET_MIN, days)))),
    }),
    [snapshot, offsetDays],
  );

  return <TideContext.Provider value={value}>{children}</TideContext.Provider>;
}

export function useTide(): TideContextValue {
  const ctx = useContext(TideContext);
  if (!ctx) throw new Error("useTide must be used inside <TideProvider>");
  return ctx;
}
