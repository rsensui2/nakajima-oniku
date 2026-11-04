"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import type { StoryBus } from "../state/story-bus";

type SectionBox = Readonly<{ top: number; height: number }>;

function measureSections(): SectionBox[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-story-section]")).map((el) => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: Math.max(1, rect.height) };
  });
}

/** スクロール量 → S = セクション番号 + セクション内の進み */
export function storyFromScroll(y: number, sections: readonly SectionBox[]): number {
  if (sections.length === 0 || y <= sections[0].top) return 0;
  const index = sections.findIndex((s) => y < s.top + s.height);
  if (index === -1) return sections.length;
  const s = sections[index];
  return index + (y - s.top) / s.height;
}

/** Lenis の慣性スクロールと、S の配信をまとめて行う */
export function useStoryScroll(bus: StoryBus): void {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      wheelMultiplier: 0.9,
      anchors: { duration: 2.2 },
    });
    let sections = measureSections();
    const publish = () => bus.set(storyFromScroll(lenis.scroll, sections));
    const remeasure = () => {
      sections = measureSections();
      publish();
    };

    lenis.on("scroll", publish);
    const observer = new ResizeObserver(remeasure);
    observer.observe(document.body);
    void document.fonts?.ready.then(remeasure);
    remeasure();

    return () => {
      observer.disconnect();
      lenis.destroy();
    };
  }, [bus]);
}
