/**
 * ページのスクロール構成。ストーリー位置 S = セクション番号 + セクション内の進み（0–1）。
 * 3D の演出（director）と DOM の演出は、どちらもこの S だけを見て動く。
 */
export const STORY_SECTIONS = [
  "hero",
  "tide",
  "cut",
  "chart",
  "phases",
  "aging",
  "craftsman",
  "reserve",
] as const;

export type StorySection = (typeof STORY_SECTIONS)[number];

/** 各セクションの高さ（vh）。sticky のセクションは 100vh 分だけ画面に貼り付く。 */
export const SECTION_HEIGHT_VH: Readonly<Record<StorySection, number>> = {
  hero: 150,
  tide: 200,
  cut: 280,
  chart: 240,
  phases: 420,
  aging: 280,
  craftsman: 150,
  reserve: 120,
};

export const storyIndex = (section: StorySection): number => STORY_SECTIONS.indexOf(section);

/** sticky なセクションが貼り付いている間の S の幅（0–1） */
export const pinnedSpan = (section: StorySection): number => 1 - 100 / SECTION_HEIGHT_VH[section];

export const PHASE_STEP = pinnedSpan("phases") / 4;
