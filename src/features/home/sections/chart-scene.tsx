"use client";

import { useRef } from "react";
import { smoothstep } from "@/features/stage/tracks";
import { useStoryFrame } from "../state/story-context";
import { useTide } from "../state/tide-context";
import { Reveal } from "../ui/in-view";
import { SectionLabel } from "../ui/section-label";
import { SplitText } from "../ui/split-text";
import { StorySection } from "../ui/story-section";

type Note = Readonly<{ x: number; y: number; dx: number; dy: number; ja: string; en: string; depth?: string }>;

/** 断面を海図として読んだときの注記（画面上の位置は % ） */
const NOTES: readonly Note[] = [
  { x: 58, y: 24, dx: -60, dy: -36, ja: "脂の浅瀬", en: "FAT SHOAL", depth: "−0.4" },
  { x: 80, y: 33, dx: 70, dy: -30, ja: "筋間の水路", en: "SEAM CHANNEL" },
  { x: 66, y: 72, dx: -80, dy: 40, ja: "赤身の深み", en: "RED DEEP", depth: "−12" },
  { x: 86, y: 66, dx: 50, dy: 46, ja: "外皮の海岸線", en: "BARK COAST" },
];

function CompassRose() {
  const ref = useRef<SVGGElement>(null);
  useStoryFrame((s) => {
    if (ref.current) ref.current.style.transform = `rotate(${((s - 3) * 90).toFixed(2)}deg)`;
  });
  const ticks = Array.from({ length: 32 }, (_, i) => i);
  return (
    <svg viewBox="-60 -60 120 120" className="h-24 w-24 sm:h-32 sm:w-32" aria-hidden>
      <g ref={ref} style={{ transformOrigin: "0 0", transition: "transform 0.2s linear" }}>
        <circle r={52} fill="none" stroke="rgba(243,234,215,0.35)" strokeWidth={0.6} />
        <circle r={44} fill="none" stroke="rgba(243,234,215,0.2)" strokeWidth={0.6} />
        {ticks.map((i) => (
          <line
            key={i}
            x1={0}
            y1={-52}
            x2={0}
            y2={i % 8 === 0 ? -40 : i % 4 === 0 ? -45 : -48}
            stroke="rgba(243,234,215,0.5)"
            strokeWidth={0.6}
            transform={`rotate(${(i * 360) / 32})`}
          />
        ))}
        <path d="M0 -40 L6 0 L0 40 L-6 0 Z" fill="rgba(243,234,215,0.15)" stroke="rgba(243,234,215,0.6)" strokeWidth={0.6} />
        <path d="M0 -40 L6 0 L-6 0 Z" fill="#e8735a" />
        <text y={-55} fill="#f3ead7" fontSize={9} textAnchor="middle" className="font-mono">
          N
        </text>
      </g>
    </svg>
  );
}

export function ChartScene() {
  const { snapshot } = useTide();
  const overlayRef = useRef<HTMLDivElement>(null);
  useStoryFrame((s) => {
    const v = smoothstep(3.42, 3.6, s) * (1 - smoothstep(3.86, 3.98, s));
    const el = overlayRef.current;
    if (!el) return;
    el.style.opacity = v.toFixed(3);
    el.style.visibility = v < 0.002 ? "hidden" : "visible";
  });

  return (
    <StorySection section="chart" sticky label="サシと海図">
      <div className="scrim-fade pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-abyss/85 via-abyss/30 to-transparent lg:w-[55%]" />
      <Reveal className="absolute left-5 right-5 top-[16vh] sm:left-[6vw] sm:right-auto sm:max-w-[34rem]">
        <SectionLabel index="03" ja="サシと海図" en="MARBLING AS A CHART" />
        <h2 className="mt-8 font-mincho text-[clamp(2.2rem,5vw,4.6rem)] font-medium leading-[1.3] tracking-[0.1em] text-moon [text-shadow:0_0_40px_rgba(4,7,10,0.8)]">
          <SplitText text="サシは、" />
          <br />
          <SplitText text="潮の地図だ。" offset={4} />
        </h2>
        <p className="rise mt-8 text-[0.92rem] leading-[2.1] text-moon/80" style={{ "--d": "500ms" } as React.CSSProperties}>
          脂の流れは等深線に、筋は水路に似ている。中島は断面を海図のように読み、どこから刃を入れれば、いちばん旨い一枚になるかを決める。
        </p>
        <p className="rise mt-6 font-mono text-[0.64rem] leading-[1.9] tracking-[0.08em] text-moon/60" style={{ "--d": "700ms" } as React.CSSProperties}>
          ※ 断面の模様も等深線も、同じ一つの数式（筋束の境界までの距離）から描いています。
        </p>
      </Reveal>

      <div ref={overlayRef} aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block" style={{ opacity: 0 }}>
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          {NOTES.map((n) => (
            <circle key={n.en} cx={n.x} cy={n.y} r={0.35} fill="#f3ead7" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {NOTES.map((n) => (
          <div key={n.en} className="absolute" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            <svg className="absolute overflow-visible" width="1" height="1" aria-hidden>
              <line x1={0} y1={0} x2={n.dx} y2={n.dy} stroke="rgba(243,234,215,0.6)" strokeWidth={0.75} />
            </svg>
            <div
              className="absolute whitespace-nowrap bg-abyss/75 px-2 py-1 font-mono text-[0.62rem] tracking-[0.2em] text-moon/85 backdrop-blur-sm"
              style={{ transform: `translate(${n.dx + (n.dx < 0 ? -8 : 8)}px, ${n.dy - 8}px) translateX(${n.dx < 0 ? "-100%" : "0"})` }}
            >
              <span className="font-mincho text-[0.8rem] tracking-[0.3em] text-moon">{n.ja}</span>
              <span className="ml-2">{n.en}</span>
              {n.depth && <span className="ml-2 text-ember">{n.depth}</span>}
            </div>
          </div>
        ))}
        <div className="absolute right-[5vw] top-[14vh]">
          <CompassRose />
        </div>
        <div className="absolute bottom-[10vh] right-[6vw] font-mono text-[0.6rem] tracking-[0.25em] text-moon/70">
          <div className="flex items-end gap-0">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-1.5 w-12 border border-moon/60 ${i % 2 ? "bg-moon/70" : ""}`} />
            ))}
          </div>
          <p className="mt-2 flex justify-between">
            <span>0</span>
            <span>2 cm</span>
          </p>
          <p className="mt-1 text-moon/60">縮尺 1 : 1 — {snapshot?.cut.name ?? "今日の部位"}の断面</p>
        </div>
      </div>
    </StorySection>
  );
}
