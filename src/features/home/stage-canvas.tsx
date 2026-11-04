"use client";

import { useEffect, useRef } from "react";
import type { Stage, StageInput } from "@/features/stage/stage";
import { useExperience, type StageStatus } from "./state/experience-context";
import { useStoryBus } from "./state/story-context";
import { useTide } from "./state/tide-context";

/** WebGL2 が使えるかを調べ、調べるために作ったコンテキストはすぐ手放す */
function supportsWebGL2(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const initialInput = (): StageInput => ({
  story: 0,
  pointerX: 0,
  pointerY: 0,
  moonElongation: 300,
  moonIllumination: 0.25,
  moonWaxing: false,
  normalizedLevel: 0,
  todayPhase: "rising",
  reducedMotion: false,
});

/** 画面全体に固定した WebGL キャンバス。three.js 一式は動的 import で後から読む。 */
export function StageCanvas({ onStatus }: { onStatus: (status: StageStatus) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<StageInput>(initialInput());
  const bus = useStoryBus();
  const { snapshot } = useTide();
  const { stageStatus } = useExperience();

  useEffect(
    () =>
      bus.subscribe((story) => {
        inputRef.current.story = story;
      }),
    [bus],
  );

  useEffect(() => {
    if (!snapshot) return;
    const input = inputRef.current;
    input.moonElongation = snapshot.moon.elongation;
    input.moonIllumination = snapshot.moon.illumination;
    input.moonWaxing = snapshot.moon.waxing;
    input.normalizedLevel = snapshot.normalizedLevel;
    input.todayPhase = snapshot.phase;
  }, [snapshot]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      inputRef.current.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      inputRef.current.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !supportsWebGL2()) {
      onStatus("fallback");
      return;
    }
    let stage: Stage | null = null;
    let cancelled = false;
    inputRef.current.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    import("@/features/stage/stage")
      .then(async ({ Stage: StageClass }) => {
        if (cancelled) return;
        const created = new StageClass(canvas, inputRef.current, {
          onFirstFrame: () => onStatus("ready"),
          onFailure: () => onStatus("fallback"),
        });
        stage = created;
        await created.prepare();
        if (!cancelled) created.start();
      })
      .catch((error: unknown) => {
        console.error("3D stage failed to start:", error);
        onStatus("fallback");
      });

    const onVisibility = () => {
      if (!stage) return;
      if (document.hidden) stage.stop();
      else stage.start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      stage?.dispose();
    };
  }, [onStatus]);

  return (
    <div aria-hidden className="pointer-events-none fixed left-0 top-0 z-0 h-lvh w-full bg-abyss">
      <canvas
        ref={canvasRef}
        className="block h-full w-full transition-opacity duration-[1600ms]"
        style={{ opacity: stageStatus === "ready" ? 1 : 0 }}
      />
      {stageStatus === "fallback" && <div className="stage-fallback absolute inset-0" />}
    </div>
  );
}
