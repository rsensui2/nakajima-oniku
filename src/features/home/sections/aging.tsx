"use client";

import { useRef } from "react";
import { clamp01 } from "@/features/stage/tracks";
import { useStoryFrame } from "../state/story-context";
import { Reveal } from "../ui/in-view";
import { SectionLabel } from "../ui/section-label";
import { SplitText } from "../ui/split-text";
import { StorySection } from "../ui/story-section";

/** director の熟成トラック（S 5.08 → 5.6）と同じ区間 */
const AGE_FROM = 5.08;
const AGE_TO = 5.6;
const MAX_DAYS = 45;

const STEPS = [
  { ja: "仕入れ", en: "SOURCE", until: 3 },
  { ja: "湾岸熟成", en: "BAYSIDE AGING", until: 38 },
  { ja: "潮を読む", en: "READ THE TIDE", until: 44 },
  { ja: "一枚切り", en: "ONE CUT", until: 46 },
] as const;

const pad2 = (n: number) => String(n).padStart(2, "0");

export function Aging() {
  const dayRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const humidityRef = useRef<HTMLSpanElement>(null);
  const weightRef = useRef<HTMLSpanElement>(null);
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);

  useStoryFrame((s) => {
    const t = clamp01((s - AGE_FROM) / (AGE_TO - AGE_FROM));
    const day = Math.round(t * MAX_DAYS);
    if (dayRef.current) dayRef.current.textContent = pad2(day);
    if (barRef.current) barRef.current.style.transform = `scaleX(${t.toFixed(3)})`;
    if (humidityRef.current) humidityRef.current.textContent = (82 + Math.sin(s * 40) * 2.5).toFixed(1);
    if (weightRef.current) weightRef.current.textContent = String(Math.round(100 - t * 20));
    const current = STEPS.findIndex((st) => day < st.until);
    stepRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = i === current ? "1" : i < current ? "0.55" : "0.25";
      el.dataset.active = i === current ? "true" : "false";
    });
  });

  return (
    <StorySection section="aging" sticky label="湾岸熟成">
      <div className="scrim-fade pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-abyss/85 via-abyss/35 to-transparent lg:w-1/2" />

      <Reveal className="absolute left-5 right-5 top-[14vh] sm:left-[6vw] sm:right-auto sm:max-w-[30rem]">
        <SectionLabel index="05" ja="湾岸熟成" en="BAYSIDE AGING" />
        <h2 className="mt-8 whitespace-nowrap font-mincho text-[clamp(2rem,4.4vw,4rem)] font-medium leading-[1.3] tracking-[0.12em] text-moon">
          <SplitText text="浜風で、待つ。" />
        </h2>
        <p className="rise mt-7 text-[0.92rem] leading-[2.1] text-moon/80" style={{ "--d": "400ms" } as React.CSSProperties}>
          千葉の海側の湿気を、熟成庫の設計に取り込む。部位ごとに時間と温度を変え、乾いた外皮を落として、内側だけを切り出す。
        </p>
      </Reveal>

      <div className="absolute bottom-[9vh] left-5 right-5 sm:left-[6vw] sm:right-[6vw]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="font-mono text-[0.64rem] tracking-[0.3em] text-moon/55">DRY-AGING TIMELAPSE</p>
            <p className="mt-2 flex items-baseline gap-3 font-mono leading-none text-moon">
              <span className="text-[0.9rem] tracking-[0.3em] text-moon/60">DAY</span>
              <span ref={dayRef} className="tabular text-[clamp(4rem,11vw,9rem)] font-medium tracking-tight">
                00
              </span>
              <span className="text-[0.9rem] tracking-[0.2em] text-moon/40">/ {MAX_DAYS}</span>
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-10 gap-y-3 font-mono text-[0.68rem] tracking-[0.14em] text-moon/60 sm:grid-cols-4">
            <div>
              <dt className="text-moon/40">庫内温度</dt>
              <dd className="mt-1 text-base text-moon">1.5℃</dd>
            </div>
            <div>
              <dt className="text-moon/40">湿度</dt>
              <dd className="mt-1 text-base text-moon">
                <span ref={humidityRef} className="tabular">82.0</span>%
              </dd>
            </div>
            <div>
              <dt className="text-moon/40">風</dt>
              <dd className="mt-1 text-base text-moon">浜風</dd>
            </div>
            <div>
              <dt className="text-moon/40">重さ</dt>
              <dd className="mt-1 text-base text-moon">
                <span ref={weightRef} className="tabular">100</span>%
              </dd>
            </div>
          </dl>
        </div>
        <span className="mt-6 block h-px w-full bg-moon/15">
          <span ref={barRef} className="block h-full origin-left bg-ember" style={{ transform: "scaleX(0)" }} />
        </span>
        <ol className="mt-5 grid grid-cols-4 gap-3 text-[0.78rem]">
          {STEPS.map((st, i) => (
            <li
              key={st.en}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="transition-opacity duration-500"
              style={{ opacity: 0.25 }}
            >
              <p className="font-mono text-[0.6rem] tracking-[0.2em] text-ember">0{i + 1}</p>
              <p className="mt-1 font-mincho tracking-[0.2em] text-moon">{st.ja}</p>
              <p className="hidden font-mono text-[0.58rem] tracking-[0.18em] text-moon/45 sm:block">{st.en}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 font-mono text-[0.6rem] tracking-[0.1em] text-moon/35">※ 日数・湿度・重さの変化は熟成の流れを示す図で、実際の値は部位ごとに設計します。</p>
      </div>
    </StorySection>
  );
}
