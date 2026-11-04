"use client";

import { DAY_MS, formatJstDate, formatJstTime } from "@/features/tide/jst";
import type { TideSnapshot } from "@/features/tide/snapshot";
import { DATE_OFFSET_MAX, DATE_OFFSET_MIN, useTide } from "../state/tide-context";
import { trendLabel } from "../ui/format";
import { Reveal } from "../ui/in-view";
import { MoonGlyph } from "../ui/moon-glyph";
import { Odometer } from "../ui/odometer";
import { PHASE_COLOR } from "../ui/phase-colors";
import { SectionLabel } from "../ui/section-label";
import { SplitText } from "../ui/split-text";
import { StorySection } from "../ui/story-section";
import { TideCurve } from "../ui/tide-curve";

function DateScrubber() {
  const { snapshot, offsetDays, setOffsetDays } = useTide();
  const label = snapshot ? formatJstDate(snapshot.time) : "—";
  const button =
    "grid h-9 w-9 place-items-center rounded-full border border-moon/20 text-moon/80 transition-colors hover:border-moon/60 hover:text-moon disabled:opacity-30";
  return (
    <div className="mt-8 border-t border-moon/10 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-[0.66rem] tracking-[0.24em] text-moon/55">DATE — 日付を動かすと、月と潮と部位が動く</p>
        {offsetDays !== 0 && (
          <button
            type="button"
            onClick={() => setOffsetDays(0)}
            className="font-mono text-[0.66rem] tracking-[0.2em] text-ember underline-offset-4 hover:underline"
          >
            ● 現在に戻る
          </button>
        )}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button type="button" className={button} aria-label="前の日" disabled={offsetDays <= DATE_OFFSET_MIN} onClick={() => setOffsetDays(offsetDays - 1)}>
          ‹
        </button>
        <div className="min-w-[9.5rem] text-center font-mincho text-lg tracking-[0.12em] text-moon">{label}</div>
        <button type="button" className={button} aria-label="次の日" disabled={offsetDays >= DATE_OFFSET_MAX} onClick={() => setOffsetDays(offsetDays + 1)}>
          ›
        </button>
        <input
          type="range"
          min={DATE_OFFSET_MIN}
          max={DATE_OFFSET_MAX}
          step={1}
          value={offsetDays}
          onChange={(e) => setOffsetDays(Number(e.target.value))}
          className="tide-range ml-2 hidden flex-1 sm:block"
          aria-label="日付をずらす（日）"
          data-lenis-prevent
        />
      </div>
    </div>
  );
}

function CutCard({ snapshot }: { snapshot: TideSnapshot }) {
  const { cut } = snapshot;
  return (
    <div className="relative overflow-hidden rounded-[2px] border border-moon/15 bg-abyss/55 p-6 backdrop-blur-md sm:p-8">
      <p className="flex items-center gap-2 font-mono text-[0.64rem] tracking-[0.26em] text-moon/55">
        <span className="h-2 w-2 rounded-full" style={{ background: PHASE_COLOR[cut.phase] }} />
        いま切るなら — {cut.phaseLabel} {cut.phaseEnglish}
      </p>
      <p key={cut.id} className="mt-5 font-mincho text-[clamp(2.6rem,5vw,3.8rem)] leading-none tracking-[0.12em] text-moon">
        <SplitText text={cut.name} className="is-in" />
      </p>
      <p className="mt-2 font-mono text-xs tracking-[0.2em] text-moon/45">{cut.reading}</p>
      <p className="mt-6 text-[0.92rem] leading-[2] text-moon/80">{cut.description}</p>
      <dl className="mt-6 grid gap-3 border-t border-moon/10 pt-5 text-[0.84rem]">
        <div className="grid grid-cols-[4.5rem_1fr] gap-3">
          <dt className="font-mono text-[0.66rem] tracking-[0.2em] text-moon/45">火入れ</dt>
          <dd className="text-moon/85">{cut.cooking}</dd>
        </div>
        <div className="grid grid-cols-[4.5rem_1fr] gap-3">
          <dt className="font-mono text-[0.66rem] tracking-[0.2em] text-moon/45">脂・旨味</dt>
          <dd className="text-moon/85">{cut.fatNote}</dd>
        </div>
      </dl>
    </div>
  );
}

function MoonCard({ snapshot }: { snapshot: TideSnapshot }) {
  const { moon } = snapshot;
  return (
    <div className="flex items-center gap-6 border border-moon/10 bg-abyss/40 p-6 backdrop-blur-md">
      <MoonGlyph illumination={moon.illumination} waxing={moon.waxing} size={76} />
      <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 font-mono text-[0.7rem] tracking-[0.12em]">
        <div>
          <dt className="text-moon/45">月齢</dt>
          <dd className="mt-1 text-xl text-moon">{moon.age.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-moon/45">月</dt>
          <dd className="mt-1 font-mincho text-lg tracking-[0.15em] text-moon">{moon.name}</dd>
        </div>
        <div>
          <dt className="text-moon/45">潮名</dt>
          <dd className="mt-1 font-mincho text-lg tracking-[0.15em] text-moon">{snapshot.tideName}</dd>
        </div>
        <div>
          <dt className="text-moon/45">輝面比</dt>
          <dd className="mt-1 text-xl text-moon">{Math.round(moon.illumination * 100)}%</dd>
        </div>
      </dl>
    </div>
  );
}

export function TidePanel() {
  const { snapshot } = useTide();
  const next = snapshot?.next;
  const daysToSpring = snapshot ? Math.round((snapshot.nextSpringTide - snapshot.day.start) / DAY_MS) : 0;

  return (
    <StorySection section="tide" id="tide" label="今日の潮">
      <div className="scrim-fade pointer-events-none absolute inset-0 bg-gradient-to-r from-abyss/90 via-abyss/55 to-abyss/10" />
      <div className="relative mx-auto max-w-[1500px] px-5 pb-24 pt-[24vh] sm:px-10">
        <Reveal>
          <SectionLabel index="01" ja="今日の潮" en="TODAY'S TIDE" />
          <h2 className="mt-8 font-mincho text-[clamp(2rem,4.6vw,4.2rem)] font-medium leading-[1.35] tracking-[0.08em] text-moon">
            <SplitText text="いま、東京湾は" />
            <span className="inline-flex items-baseline whitespace-nowrap">
              <span className="mx-3 inline-flex items-baseline font-mono text-[1.15em] tracking-normal text-moon">
                <Odometer value={snapshot?.level ?? 0} pad={3} />
                <span className="ml-2 text-[0.42em] tracking-[0.2em] text-moon/60">cm</span>
              </span>
              <SplitText text="。" offset={8} />
            </span>
          </h2>
          <p className="rise mt-6 max-w-2xl text-[0.95rem] leading-[2] text-moon/75" style={{ "--d": "400ms" } as React.CSSProperties}>
            {snapshot
              ? `${trendLabel(snapshot.rate)}（${snapshot.cut.phaseLabel}）。${
                  next ? `次の${next.type === "high" ? "満潮" : "干潮"}は ${formatJstTime(next.time)}、${Math.round(next.level)}cm。` : ""
                }今日は${snapshot.tideName}で、次の大潮まであと${daysToSpring}日。`
              : "潮を計算しています…"}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-14">
          <Reveal className="rise">
            <p className="mb-4 font-mono text-[0.64rem] tracking-[0.26em] text-moon/50">TIDE CURVE — 東京（気象庁 潮位表基準面）</p>
            {snapshot ? <TideCurve snapshot={snapshot} /> : <div className="aspect-[10/3] animate-pulse bg-moon/5" />}
            <DateScrubber />
          </Reveal>
          <Reveal className="rise flex flex-col gap-6" delay={150}>
            {snapshot && <CutCard snapshot={snapshot} />}
            {snapshot && <MoonCard snapshot={snapshot} />}
          </Reveal>
        </div>

        <Reveal className="rise mt-12 max-w-3xl font-mono text-[0.66rem] leading-[1.9] tracking-[0.06em] text-moon/45">
          <p>
            潮位はこのページが開かれた瞬間に、気象庁「分潮一覧表 東京」の調和定数（主要25分潮・交点補正つき）からブラウザ内で推算しています。
            2026年の気象庁の毎時潮位 8,760点との比較で、誤差は RMS 1.9cm・最大 6.4cm。
          </p>
        </Reveal>
      </div>
    </StorySection>
  );
}
