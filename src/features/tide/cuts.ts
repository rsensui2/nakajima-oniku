export type TidePhase = "rising" | "high" | "ebbing" | "low";

export type Cut = Readonly<{
  id: "katarosu" | "misuji" | "rump" | "hire";
  phase: TidePhase;
  phaseLabel: string;
  phaseEnglish: string;
  name: string;
  reading: string;
  description: string;
  cooking: string;
  fatNote: string;
}>;

/** 潮の一巡の順（満ち潮 → 満潮 → 引き潮 → 干潮） */
export const PHASE_ORDER: readonly TidePhase[] = ["rising", "high", "ebbing", "low"];

export const CUTS: Readonly<Record<TidePhase, Cut>> = {
  rising: {
    id: "katarosu",
    phase: "rising",
    phaseLabel: "満ち潮",
    phaseEnglish: "RISING",
    name: "肩ロース",
    reading: "かたロース",
    description:
      "満ちていく潮には、脂と赤身の釣り合いがいちばん読みやすい部位を合わせる。迷ったら、これ。",
    cooking: "すき焼き・しゃぶしゃぶ・ローストビーフ",
    fatNote: "霜降りと赤身の境目を楽しむ日。火は入れすぎない。",
  },
  high: {
    id: "misuji",
    phase: "high",
    phaseLabel: "満潮",
    phaseEnglish: "HIGH WATER",
    name: "ミスジ",
    reading: "みすじ",
    description:
      "満ち切った潮で、中央の筋に沿って一枚で抜く。一頭からわずかしか取れない、今日の主役。",
    cooking: "厚切りステーキ・焼肉",
    fatNote: "細かなサシが全体に入る。強火で面を固め、余熱で仕上げる。",
  },
  ebbing: {
    id: "rump",
    phase: "ebbing",
    phaseLabel: "引き潮",
    phaseEnglish: "EBBING",
    name: "ランプ",
    reading: "らんぷ",
    description: "引き始めの潮。脂が締まり、火を入れると香ばしさが立つ赤身。",
    cooking: "ステーキ・ガーリックソテー・タタキ",
    fatNote: "脂は控えめ。中〜強火で面を焼き固め、塩は焼く直前に。",
  },
  low: {
    id: "hire",
    phase: "low",
    phaseLabel: "干潮",
    phaseEnglish: "LOW WATER",
    name: "ヒレ",
    reading: "ひれ",
    description: "干潮の静けさに合わせる、いちばんやわらかな赤身。熟成はかけすぎない。",
    cooking: "シャトーブリアン・ビーフカツ",
    fatNote: "脂はほぼない。低温でゆっくり、粗塩は最後にひとつまみ。",
  },
};

export const phaseIndex = (phase: TidePhase): number => PHASE_ORDER.indexOf(phase);
