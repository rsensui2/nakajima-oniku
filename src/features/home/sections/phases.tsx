"use client";

import { useRef } from "react";
import { PHASE_STEP, storyIndex } from "@/features/stage/story";
import { CUTS, PHASE_ORDER } from "@/features/tide/cuts";
import { useStoryFrame, useStoryValue } from "../state/story-context";
import { useTide } from "../state/tide-context";
import { Reveal } from "../ui/in-view";
import { PHASE_COLOR } from "../ui/phase-colors";
import { SectionLabel } from "../ui/section-label";
import { StorySection } from "../ui/story-section";

const AT = storyIndex("phases");
const WAVE_W = 400;
const WAVE_MID = 60;
const WAVE_AMP = 38;
const waveY = (x: number) => WAVE_MID - WAVE_AMP * Math.sin((x / WAVE_W) * Math.PI * 2);
const WAVE_PATH = Array.from({ length: 81 }, (_, i) => {
  const x = -40 + (i / 80) * (WAVE_W + 80);
  return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${waveY(x).toFixed(1)}`;
}).join(" ");

const localStep = (s: number) => (s - AT) / PHASE_STEP;

function TideWave() {
  const dotRef = useRef<SVGCircleElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  useStoryFrame((s) => {
    const x = Math.min(300, Math.max(0, (localStep(s) - 0.5) * 100));
    const y = waveY(x);
    dotRef.current?.setAttribute("cx", x.toFixed(1));
    dotRef.current?.setAttribute("cy", y.toFixed(1));
    lineRef.current?.setAttribute("x1", x.toFixed(1));
    lineRef.current?.setAttribute("x2", x.toFixed(1));
  });
  return (
    <svg viewBox={`-40 0 ${WAVE_W + 80} 120`} className="h-auto w-full max-w-md" aria-hidden>
      <line x1={-40} x2={WAVE_W + 40} y1={WAVE_MID} y2={WAVE_MID} stroke="rgba(243,234,215,0.15)" strokeDasharray="2 5" />
      <path d={WAVE_PATH} fill="none" stroke="rgba(243,234,215,0.45)" strokeWidth={1.2} />
      {PHASE_ORDER.map((phase, i) => (
        <g key={phase}>
          <circle cx={i * 100} cy={waveY(i * 100)} r={3} fill={PHASE_COLOR[phase]} />
          <text x={i * 100} y={i === 1 ? 10 : i === 3 ? 116 : WAVE_MID + 18} textAnchor="middle" fontSize={11} fill="rgba(243,234,215,0.6)">
            {CUTS[phase].phaseLabel}
          </text>
        </g>
      ))}
      <line ref={lineRef} y1={4} y2={116} stroke="rgba(232,115,90,0.5)" />
      <circle ref={dotRef} r={7} fill="none" stroke="#e8735a" strokeWidth={1.5} />
    </svg>
  );
}

export function Phases() {
  const { snapshot } = useTide();
  const step = useStoryValue((s) => Math.min(3, Math.max(0, Math.floor(localStep(s)))));

  return (
    <StorySection section="phases" sticky label="四つの潮、四つの部位">
      <div className="scrim-fade pointer-events-none absolute inset-y-0 right-0 hidden w-[60%] bg-gradient-to-l from-abyss/85 via-abyss/50 to-transparent lg:block" />
      <div className="scrim-fade pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-abyss/95 via-abyss/70 to-transparent lg:hidden" />

      <Reveal className="absolute left-5 top-[13vh] sm:left-[6vw]">
        <SectionLabel index="04" ja="四つの潮、四つの部位" en="FOUR TIDES / FOUR CUTS" />
      </Reveal>

      <div className="absolute inset-x-5 bottom-[6vh] lg:inset-x-auto lg:bottom-auto lg:right-[6vw] lg:top-1/2 lg:w-[min(36rem,40vw)] lg:-translate-y-1/2">
        <div className="hidden sm:block">
          <TideWave />
        </div>
        <div className="relative mt-6 min-h-[19rem] sm:min-h-[21rem]">
          {PHASE_ORDER.map((phase, i) => {
            const cut = CUTS[phase];
            const active = i === step;
            const isNow = snapshot?.phase === phase;
            return (
              <article
                key={phase}
                aria-hidden={!active}
                className="absolute inset-0 transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: active ? 1 : 0,
                  transform: active ? "none" : `translate3d(0, ${i < step ? -24 : 24}px, 0)`,
                  filter: active ? "none" : "blur(6px)",
                }}
              >
                <p className="flex items-center gap-3 font-mono text-[0.66rem] tracking-[0.26em] text-moon/55">
                  <span className="text-ember">0{i + 1} / 04</span>
                  <span style={{ color: PHASE_COLOR[phase] }}>
                    {cut.phaseLabel} {cut.phaseEnglish}
                  </span>
                  {isNow && (
                    <span className="flex items-center gap-1.5 rounded-full border border-ember/60 px-2 py-0.5 text-ember">
                      <span className="live-dot h-1.5 w-1.5 rounded-full bg-ember" />
                      いまの潮
                    </span>
                  )}
                </p>
                <h3 className="mt-4 font-mincho text-[clamp(2.8rem,6vw,5rem)] font-medium leading-none tracking-[0.12em] text-moon">
                  {cut.name}
                </h3>
                <p className="mt-2 font-mono text-xs tracking-[0.2em] text-moon/45">{cut.reading}</p>
                <p className="mt-5 max-w-md text-[0.92rem] leading-[2] text-moon/80">{cut.description}</p>
                <dl className="mt-5 grid max-w-md gap-2 border-t border-moon/10 pt-4 text-[0.82rem]">
                  <div className="grid grid-cols-[4.5rem_1fr] gap-3">
                    <dt className="font-mono text-[0.64rem] tracking-[0.2em] text-moon/45">火入れ</dt>
                    <dd className="text-moon/85">{cut.cooking}</dd>
                  </div>
                  <div className="grid grid-cols-[4.5rem_1fr] gap-3">
                    <dt className="font-mono text-[0.64rem] tracking-[0.2em] text-moon/45">脂</dt>
                    <dd className="text-moon/85">{cut.fatNote}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
        <div className="mt-4 flex gap-2" aria-hidden>
          {PHASE_ORDER.map((phase, i) => (
            <span key={phase} className="h-[2px] flex-1 bg-moon/15">
              <span
                className="block h-full transition-transform duration-700"
                style={{ background: PHASE_COLOR[phase], transform: `scaleX(${i <= step ? 1 : 0})`, transformOrigin: "left" }}
              />
            </span>
          ))}
        </div>
      </div>
    </StorySection>
  );
}
