"use client";

import { DAY_MS, HOUR_MS, MINUTE_MS, formatJstDate } from "@/features/tide/jst";
import { nextSpringTideStart } from "@/features/tide/tide-name";
import { Reveal } from "../ui/in-view";
import { MagneticLink } from "../ui/magnetic-link";
import { SectionLabel } from "../ui/section-label";
import { StorySection } from "../ui/story-section";
import { useNow } from "../ui/use-now";

const pad2 = (n: number) => String(n).padStart(2, "0");

function Countdown({ target, now }: { target: number; now: number | null }) {
  const remain = now === null ? 0 : Math.max(0, target - now);
  const parts = [
    { v: Math.floor(remain / DAY_MS), u: "日" },
    { v: Math.floor((remain % DAY_MS) / HOUR_MS), u: "時間" },
    { v: Math.floor((remain % HOUR_MS) / MINUTE_MS), u: "分" },
    { v: Math.floor((remain % MINUTE_MS) / 1000), u: "秒" },
  ];
  return (
    <p className="flex flex-wrap items-baseline gap-x-5 gap-y-2 font-mono text-moon" aria-live="off">
      <span className="text-[0.66rem] tracking-[0.3em] text-moon/50">あと</span>
      {parts.map((p, i) => (
        <span key={p.u} className="flex items-baseline gap-1.5">
          <span className="tabular text-[clamp(2rem,4.5vw,3.4rem)] leading-none">{i === 0 ? p.v : pad2(p.v)}</span>
          <span className="text-[0.7rem] tracking-[0.2em] text-moon/50">{p.u}</span>
        </span>
      ))}
    </p>
  );
}

export function Reserve() {
  // 日付スライダーとは独立に、常に「本当の今」から見た次の大潮
  const now = useNow();
  const spring = now === null ? null : nextSpringTideStart(now);

  return (
    <StorySection section="reserve" id="reserve" label="事前申込">
      <div className="scrim-fade-top pointer-events-none absolute inset-0 bg-gradient-to-t from-abyss via-abyss/60 to-transparent" />
      <div className="relative mx-auto flex h-full max-w-[1500px] flex-col justify-end px-5 pb-[14vh] sm:px-10">
        <Reveal>
          <SectionLabel index="07" ja="事前申込" en="RESERVE YOUR CUT" />
          <h2 className="mt-8 font-mincho text-[clamp(2.2rem,5.4vw,5rem)] font-medium leading-[1.3] tracking-[0.08em] text-moon">
            {spring !== null ? (
              <>
                次の大潮は、
                <br className="sm:hidden" />
                <span className="whitespace-nowrap">
                  <span className="text-ember">{formatJstDate(spring)}</span>から。
                </span>
              </>
            ) : (
              "次の大潮を計算しています。"
            )}
          </h2>
          <p className="rise mt-6 max-w-xl text-[0.95rem] leading-[2] text-moon/75" style={{ "--d": "300ms" } as React.CSSProperties}>
            潮がいちばん大きく動く日に、その日の一枚を。実店舗はオープン準備中です。まずは事前申込で、あなたの「切り口」を予約してください。
          </p>
        </Reveal>
        <Reveal className="rise mt-10" delay={200}>
          {spring !== null && <Countdown target={spring} now={now} />}
        </Reveal>
        <Reveal className="rise mt-12 flex flex-wrap gap-4" delay={350}>
          <MagneticLink href="/apply">事前申込へ</MagneticLink>
          <MagneticLink href="/concept" variant="ghost">
            コンセプトを読む
          </MagneticLink>
        </Reveal>
      </div>
    </StorySection>
  );
}
