"use client";

import { useRef } from "react";
import { smoothstep } from "@/features/stage/tracks";
import { useStoryFrame } from "../state/story-context";
import { useCoarsePointer } from "./use-media-query";

export type StoryLine = Readonly<{ text: string; from: number; to: number }>;

const FADE = 0.05;

/** ストーリー位置 S の区間ごとに入れ替わる大きな文。文字ごとに少しずつずれて現れる。 */
export function StoryLines({ lines, className }: { lines: readonly StoryLine[]; className?: string }) {
  const refs = useRef<Array<HTMLParagraphElement | null>>([]);
  const coarse = useCoarsePointer();

  useStoryFrame((s) => {
    lines.forEach((line, i) => {
      const el = refs.current[i];
      if (!el) return;
      const isLast = i === lines.length - 1;
      const enter = smoothstep(line.from - FADE, line.from + FADE, s);
      const exit = isLast ? 0 : smoothstep(line.to - FADE, line.to + FADE, s);
      const v = enter * (1 - exit);
      el.style.opacity = v.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - enter) * 28 - exit * 28).toFixed(1)}px, 0)`;
      el.style.filter = !coarse && v < 0.99 ? `blur(${((1 - v) * 8).toFixed(1)}px)` : "";
    });
  });

  return (
    <div className={`relative ${className ?? ""}`}>
      {lines.map((line, i) => (
        <p
          key={line.text}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`${i === 0 ? "relative" : "absolute inset-x-0 top-0"} font-mincho text-[clamp(1.75rem,3.9vw,3.7rem)] font-medium leading-[1.35] tracking-[0.1em] sm:whitespace-nowrap text-moon [text-shadow:0_0_40px_rgba(4,7,10,0.8)]`}
          style={{ opacity: 0 }}
        >
          {line.text}
        </p>
      ))}
    </div>
  );
}
