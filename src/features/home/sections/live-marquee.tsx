"use client";

import { formatJstTime } from "@/features/tide/jst";
import { useTide } from "../state/tide-context";
import { trendArrow } from "../ui/format";
import { Marquee } from "../ui/marquee";

const STATIC_ITEMS = ["ONE TIDE, ONE CUT", "潮待熟成 中島", "CHIBA — TOKYO BAY", "一枚切り"] as const;

/** いまの潮の値が流れるテロップ */
export function LiveMarquee() {
  const { snapshot } = useTide();
  const live = snapshot
    ? [
        `TOKYO BAY ${Math.round(snapshot.level)}cm ${trendArrow(snapshot.rate)}`,
        `${snapshot.cut.phaseLabel} → ${snapshot.cut.name}`,
        `MOON ${snapshot.moon.age.toFixed(1)}d ${snapshot.moon.name}`,
        snapshot.tideName,
        ...snapshot.day.extremes.map((e) => `${e.type === "high" ? "満潮" : "干潮"} ${formatJstTime(e.time)} ${Math.round(e.level)}cm`),
      ]
    : [];
  return (
    <div className="relative z-10 font-mono text-[0.7rem] tracking-[0.22em] text-moon/70">
      <Marquee items={[...live, ...STATIC_ITEMS]} duration={60} />
    </div>
  );
}
