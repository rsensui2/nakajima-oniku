"use client";

import { useEffect, useRef, useState } from "react";
import { TOKYO_STATION } from "@/features/tide/station";
import { useExperience } from "../state/experience-context";
import { useTide } from "../state/tide-context";
import { formatCoordinate } from "./format";
import { useCountUp } from "./use-count-up";
import { useReducedMotion } from "./use-media-query";

const MIN_VISIBLE_MS = 1900;
const MAX_WAIT_MS = 4200;
const EXIT_MS = 1500;

type Phase = "enter" | "exit" | "done";

/** 水平線が引かれ、潮と月の値が数え上がり、上下に割れて夜の海が現れる */
export function Loader({ onDone }: { onDone: () => void }) {
  const { stageStatus } = useExperience();
  const { snapshot } = useTide();
  const [phase, setPhase] = useState<Phase>("enter");
  const mountedAt = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (reduced) onDone();
  }, [reduced, onDone]);

  useEffect(() => {
    if (phase !== "enter") return;
    const elapsed = performance.now() - mountedAt.current;
    const ready = stageStatus !== "loading";
    const wait = ready ? Math.max(0, MIN_VISIBLE_MS - elapsed) : Math.max(0, MAX_WAIT_MS - elapsed);
    const timer = window.setTimeout(() => setPhase("exit"), wait);
    return () => window.clearTimeout(timer);
  }, [stageStatus, phase]);

  useEffect(() => {
    if (phase !== "exit") return;
    const reveal = window.setTimeout(onDone, 350);
    const done = window.setTimeout(() => setPhase("done"), EXIT_MS);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(done);
    };
  }, [phase, onDone]);

  const counting = snapshot !== null && phase !== "done";
  const age = useCountUp(snapshot?.moon.age ?? 0, 1300, counting);
  const level = useCountUp(snapshot?.level ?? 0, 1300, counting);

  if (phase === "done" || reduced) return null;
  const exiting = phase === "exit";
  const curtain = "absolute inset-x-0 h-1/2 bg-abyss transition-transform duration-[1300ms] ease-[cubic-bezier(0.76,0,0.24,1)]";

  return (
    <div aria-hidden className="loader-failsafe fixed inset-0 z-[100] select-none">
      <div className={`${curtain} top-0`} style={{ transform: exiting ? "translateY(-100%)" : "none" }} />
      <div className={`${curtain} bottom-0`} style={{ transform: exiting ? "translateY(100%)" : "none" }} />

      <div
        className="absolute inset-x-0 top-1/2 h-px origin-center bg-moon/80 transition-[transform,opacity] duration-[1200ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
        style={{
          transform: exiting ? "scaleX(1.0)" : undefined,
          opacity: exiting ? 0 : 1,
          animation: exiting ? undefined : "loader-line 1.3s cubic-bezier(0.22,1,0.36,1) both",
        }}
      />

      <div
        className="absolute inset-x-0 bottom-1/2 mb-4 flex items-end justify-between px-6 font-mono text-[0.68rem] tracking-[0.22em] text-moon/70 transition-opacity duration-500 sm:px-12"
        style={{ opacity: exiting ? 0 : 1 }}
      >
        <span>
          {formatCoordinate(TOKYO_STATION.latitude, "N")} {formatCoordinate(TOKYO_STATION.longitude, "E")}
        </span>
        <span className="hidden sm:inline">TOKYO BAY — TIDE STATION {TOKYO_STATION.code}</span>
      </div>

      <div
        className="absolute inset-x-0 top-1/2 mt-4 flex items-start justify-between px-6 font-mono text-[0.68rem] tracking-[0.22em] text-moon/70 transition-opacity duration-500 sm:px-12"
        style={{ opacity: exiting ? 0 : 1 }}
      >
        <span className="tabular">
          MOON {age.toFixed(1)}d　TIDE {Math.round(level)}cm
        </span>
        <span className="font-mincho tracking-[0.4em] text-moon/80">潮を読んでいます</span>
      </div>

    </div>
  );
}
