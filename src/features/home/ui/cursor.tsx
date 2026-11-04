"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery, useReducedMotion } from "./use-media-query";

const FOLLOW = 0.18;

/** 細かいポインタ（マウス）の環境だけで出る、追従する輪。リンク上で広がる。 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const fine = useMediaQuery("(pointer: fine)");
  const reduce = useReducedMotion();
  const enabled = fine && !reduce;

  useEffect(() => {
    if (!enabled) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let hovering = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const el = e.target instanceof Element ? e.target.closest("a, button, input, [data-cursor]") : null;
      hovering = el !== null;
    };
    const tick = () => {
      pos.x += (target.x - pos.x) * FOLLOW;
      pos.y += (target.y - pos.y) * FOLLOW;
      const ring = ringRef.current;
      if (ring) {
        const scale = hovering ? 1.9 : 1;
        ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
        ring.style.opacity = hovering ? "0.9" : "0.55";
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      ref={ringRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] h-9 w-9 rounded-full border border-moon/70 mix-blend-difference transition-[opacity,scale] duration-300"
    />
  );
}
