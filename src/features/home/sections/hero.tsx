"use client";

import { useRef } from "react";
import { smoothstep } from "@/features/stage/tracks";
import { formatJstDot, formatJstTime } from "@/features/tide/jst";
import { TOKYO_STATION } from "@/features/tide/station";
import { useExperience } from "../state/experience-context";
import { useStoryFrame } from "../state/story-context";
import { useTide } from "../state/tide-context";
import { formatCoordinate, trendArrow, trendLabel } from "../ui/format";
import { SplitText } from "../ui/split-text";
import { StorySection } from "../ui/story-section";

function LiveReadout() {
  const { snapshot, offsetDays } = useTide();
  const rows = snapshot
    ? [
        ["潮位", `${Math.round(snapshot.level)} cm ${trendArrow(snapshot.rate)} ${trendLabel(snapshot.rate)}`],
        ["局面", `${snapshot.cut.phaseLabel} ── いま切るなら ${snapshot.cut.name}`],
        ["月齢", `${snapshot.moon.age.toFixed(1)}　${snapshot.moon.name}・${snapshot.tideName}`],
        [
          snapshot.next?.type === "high" ? "次の満潮" : "次の干潮",
          snapshot.next ? `${formatJstTime(snapshot.next.time)}　${Math.round(snapshot.next.level)} cm` : "—",
        ],
      ]
    : [];

  return (
    <div className="rise mt-8 w-full max-w-md border-t border-moon/15 pt-4 font-mono text-[0.7rem] tracking-[0.12em] text-moon/70" style={{ "--d": "900ms" } as React.CSSProperties}>
      <p className="mb-3 flex items-center gap-2 text-moon/55">
        <span className={`h-1.5 w-1.5 rounded-full ${offsetDays === 0 ? "live-dot bg-ember" : "bg-moon/40"}`} />
        {offsetDays === 0 ? "LIVE" : "SIMULATED"}　{snapshot ? `${formatJstDot(snapshot.time)} ${formatJstTime(snapshot.time)} JST` : "— —"}　東京湾
      </p>
      <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-moon/45">{k}</dt>
            <dd className="text-moon/90">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Hero() {
  const { introDone } = useExperience();
  const contentRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useStoryFrame((s) => {
    const t = smoothstep(0.05, 0.5, s);
    const el = contentRef.current;
    if (el) {
      el.style.opacity = String(1 - t);
      el.style.transform = `translate3d(0, ${-t * 70}px, 0)`;
      el.style.filter = t > 0.01 ? `blur(${(t * 10).toFixed(1)}px)` : "";
    }
    if (cueRef.current) cueRef.current.style.opacity = String(1 - smoothstep(0.01, 0.12, s));
  });

  return (
    <StorySection section="hero" label="潮待熟成 中島">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div ref={contentRef} className={`relative h-full will-change-transform ${introDone ? "is-in" : ""}`}>
          <p
            className="rise absolute left-5 top-[15vh] hidden font-mono text-[0.64rem] tracking-[0.3em] text-moon/55 sm:left-[6vw] sm:block"
            style={{ "--d": "300ms" } as React.CSSProperties}
          >
            CHIBA — TOKYO BAY　{formatCoordinate(TOKYO_STATION.latitude, "N")} {formatCoordinate(TOKYO_STATION.longitude, "E")}
          </p>

          <h1 className="vertical absolute right-4 top-[12vh] font-mincho text-[clamp(1.9rem,4.1vw,4rem)] font-medium leading-[1.6] tracking-[0.14em] text-moon [text-shadow:0_0_40px_rgba(4,7,10,0.7)] sm:right-[7vw] sm:top-[13vh]">
            <span className="block whitespace-nowrap">
              <SplitText text="潮が満ちる日に、" delay={200} />
            </span>
            <span className="block whitespace-nowrap pt-[1.6em]">
              <SplitText text="切り口は一枚だけ。" delay={200} offset={8} />
            </span>
          </h1>

          <div className="absolute bottom-[9vh] left-5 right-5 sm:bottom-[11vh] sm:left-[6vw] sm:right-auto">
            <p className="rise font-serif text-lg italic tracking-[0.08em] text-moon/70 sm:text-xl" style={{ "--d": "500ms" } as React.CSSProperties}>
              Tide-read, dry-aged, cut one at a time.
            </p>
            <p className="rise mt-3 max-w-md text-[0.92rem] leading-[2] text-moon/85 sm:text-[0.98rem]" style={{ "--d": "650ms" } as React.CSSProperties}>
              千葉の熟成肉店「潮待熟成 中島」は、東京湾の潮位と月齢を読み、その時刻にいちばん旨味が読みやすい部位を一枚だけ切り出します。
            </p>
            <LiveReadout />
          </div>
        </div>

        <div ref={cueRef} className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex">
          <span className="font-mono text-[0.6rem] tracking-[0.4em] text-moon/50">SCROLL</span>
          <span className="relative h-12 w-px overflow-hidden bg-moon/15">
            <span className="scroll-cue-line absolute inset-0 bg-moon/80" />
          </span>
        </div>
      </div>
    </StorySection>
  );
}
