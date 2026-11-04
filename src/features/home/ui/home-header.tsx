"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SoundToggle } from "../sound/sound-toggle";
import { useExperience } from "../state/experience-context";
import { useTide } from "../state/tide-context";
import { trendArrow } from "./format";

const HIDE_AFTER_PX = 160;

export function HomeHeader() {
  const { snapshot, offsetDays } = useTide();
  const { introDone } = useExperience();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY + 2;
      const goingUp = y < lastY - 2;
      if (goingDown && y > HIDE_AFTER_PX) setHidden(true);
      else if (goingUp || y < HIDE_AFTER_PX) setHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      onFocusCapture={() => setHidden(false)}
      className="fixed inset-x-0 top-0 z-50 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        transform: hidden ? "translateY(-110%)" : "none",
        opacity: introDone ? 1 : 0,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-abyss/80 to-transparent" />
      <div className="relative mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-5 py-4 sm:px-10 sm:py-6">
        <Link href="/" className="group flex flex-col leading-none" aria-label="潮待熟成 中島 トップ">
          <span className="font-serif text-[0.78rem] italic tracking-[0.16em] text-moon/55">Nakajima Tide Cut</span>
          <span className="mt-1.5 font-mincho text-[1.05rem] tracking-[0.28em] text-moon transition-colors group-hover:text-ember sm:text-lg">
            潮待熟成 中島
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          {snapshot && (
            <a
              href="#tide"
              className="hidden items-center gap-2 font-mono text-[0.66rem] tracking-[0.18em] text-moon/70 transition-colors hover:text-moon lg:flex"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${offsetDays === 0 ? "live-dot bg-ember" : "bg-moon/40"}`} />
              TOKYO BAY <span className="tabular text-moon">{Math.round(snapshot.level)}cm</span>
              {trendArrow(snapshot.rate)}
            </a>
          )}
          <nav className="flex items-center gap-1 text-[0.8rem] sm:gap-2">
            <a href="#tide" className="hidden rounded-full px-3 py-1.5 text-moon/75 transition-colors hover:text-moon md:inline">
              今日の潮
            </a>
            <Link href="/concept" className="hidden rounded-full px-3 py-1.5 text-moon/75 transition-colors hover:text-moon md:inline">
              コンセプト
            </Link>
            <Link
              href="/apply"
              className="rounded-full border border-moon/30 px-4 py-1.5 text-moon transition-colors hover:border-ember hover:bg-ember hover:text-abyss"
            >
              事前申込
            </Link>
          </nav>
          <div className="hidden sm:block">
            <SoundToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
