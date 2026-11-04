"use client";

import { useEffect, useState } from "react";
import { getTideRecommendation, type TideRecommendation } from "@/lib/tide";

export function TideCard() {
  const [tide, setTide] = useState<TideRecommendation | null>(null);
  const [dateLabel, setDateLabel] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    setTide(getTideRecommendation(now));
    setDateLabel(
      new Intl.DateTimeFormat("ja-JP", {
        dateStyle: "long",
        timeZone: "Asia/Tokyo",
      }).format(now),
    );
  }, []);

  return (
    <article
      id="tide"
      className="relative overflow-hidden rounded-2xl bg-sea text-foam shadow-xl shadow-sea/20"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-tide/40 blur-2xl"
        aria-hidden
      />
      <div className="relative p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-foam/70 uppercase">
          Today&apos;s Tide Card
        </p>
        <p className="mt-1 text-sm text-foam/80 min-h-[1.25rem]">
          {dateLabel || "読み込み中…"}
        </p>
        {tide ? (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                {tide.phaseLabel}
              </span>
              <span className="rounded-full bg-coral/90 px-3 py-1 text-xs font-medium text-white">
                {tide.moonLabel}
              </span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              {tide.cutName}
              <span className="ml-2 text-lg font-normal text-foam/70">{tide.cutReading}</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-foam/90">{tide.description}</p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white/10 p-4">
                <dt className="text-xs font-semibold text-foam/60">火入れ</dt>
                <dd className="mt-1 text-sm">{tide.cooking}</dd>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <dt className="text-xs font-semibold text-foam/60">脂・旨味</dt>
                <dd className="mt-1 text-sm">{tide.fatNote}</dd>
              </div>
            </dl>
          </>
        ) : (
          <div className="mt-8 h-40 animate-pulse rounded-xl bg-white/10" aria-hidden />
        )}
        <p className="mt-6 text-xs text-foam/55">
          ※ 潮位は公開用の簡易カレンダーです。実際の切り口は申込内容と在庫で中島が確定します。
        </p>
      </div>
    </article>
  );
}
