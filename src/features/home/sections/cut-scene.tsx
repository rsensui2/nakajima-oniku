"use client";

import { useRef } from "react";
import { smoothstep } from "@/features/stage/tracks";
import { useStoryFrame } from "../state/story-context";
import { Reveal } from "../ui/in-view";
import { SectionLabel } from "../ui/section-label";
import { StoryLines, type StoryLine } from "../ui/story-lines";
import { StorySection } from "../ui/story-section";

const LINES: readonly StoryLine[] = [
  { text: "潮が引くのを、待つ。", from: 2.02, to: 2.2 },
  { text: "刃を入れるのは、一度だけ。", from: 2.2, to: 2.4 },
  { text: "一枚だけ、切る。", from: 2.4, to: 2.7 },
];

/** 刃が入る瞬間（S ≈ 2.33）に画面を斜めに走る光 */
function Flash() {
  const lineRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  useStoryFrame((s) => {
    const t = smoothstep(2.27, 2.36, s);
    const fade = 1 - smoothstep(2.34, 2.46, s);
    const v = t * fade;
    if (lineRef.current) {
      lineRef.current.style.transform = `translate3d(${(-60 + t * 120).toFixed(1)}vw, 0, 0) rotate(-14deg)`;
      lineRef.current.style.opacity = v.toFixed(3);
    }
    if (glowRef.current) glowRef.current.style.opacity = (v * 0.35).toFixed(3);
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen">
      <div ref={glowRef} className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,226,200,0.5),transparent_60%)] opacity-0" />
      <div
        ref={lineRef}
        className="absolute left-1/2 top-1/2 h-[2px] w-[140vw] -translate-y-1/2 bg-gradient-to-r from-transparent via-[#fff2e4] to-transparent opacity-0 shadow-[0_0_24px_6px_rgba(255,214,180,0.6)]"
      />
    </div>
  );
}

export function CutScene() {
  return (
    <StorySection section="cut" sticky label="一枚切り">
      <Flash />
      <Reveal className="absolute left-5 top-[14vh] sm:left-[6vw]">
        <SectionLabel index="02" ja="一枚切り" en="THE ONE CUT" />
      </Reveal>
      <div className="absolute bottom-[10vh] left-5 right-5 sm:bottom-[12vh] sm:left-[6vw] sm:right-auto sm:max-w-[44rem]">
        <StoryLines lines={LINES} />
        <Reveal className="rise mt-6 max-w-lg text-[0.92rem] leading-[2] text-moon/75" delay={200}>
          大量には並べません。人数・調理法・ご希望と、その日の潮を照らし合わせて、中島が一枚を決めます。肉を「買う」より、切り口を「受け取る」店です。
        </Reveal>
      </div>
      <div className="absolute bottom-[12vh] right-[6vw] hidden text-right font-mono text-[0.64rem] leading-[2] tracking-[0.22em] text-moon/45 lg:block">
        <p>BLOCK — 湾岸熟成の塊</p>
        <p>SLICE — 厚さは調理法で決める</p>
        <p>NOTE — 潮位メモ・切り方・火入れの一枚絵つき</p>
      </div>
    </StorySection>
  );
}
