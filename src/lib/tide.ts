export type TidePhase = "high" | "ebbing" | "low" | "rising";

export type TideRecommendation = {
  phase: TidePhase;
  phaseLabel: string;
  moonLabel: string;
  cutName: string;
  cutReading: string;
  description: string;
  cooking: string;
  fatNote: string;
};

const CUTS: Record<TidePhase, Omit<TideRecommendation, "phase" | "phaseLabel" | "moonLabel">> = {
  high: {
    cutName: "板腱",
    cutReading: "いたじん",
    description:
      "満ち潮に合わせ、筋の流れを一枚で抜く。噛むほど旨味が立つ、今日の主役。",
    cooking: "厚切りステーキ、低温ロースト",
    fatNote: "霜降りは控えめ。赤身の旨味を潮の満ちとともに。",
  },
  ebbing: {
    cutName: "ランプ",
    cutReading: "らんぷ",
    description:
      "引き始めの潮。脂が引き締まり、火入れで香ばしさが際立つ部位。",
    cooking: "焼肉、ガーリックソテー",
    fatNote: "適度な脂筋。中〜強火で表面を先に固める。",
  },
  low: {
    cutName: "カタロース",
    cutReading: "かたろーす",
    description:
      "干潮の静けさに合う、やわらかな赤身。余計な熟成をかけすぎない一日。",
    cooking: "薄切りステーキ、タタキ",
    fatNote: "低干潮は赤身勝負。塩は粗め、最後に一点。",
  },
  rising: {
    cutName: "肩ロース",
    cutReading: "かたロース",
    description:
      "満ち向かう潮。脂と赤身のバランスが最も読みやすい、迷ったらこれ。",
    cooking: "しゃぶしゃぶ、ローストビーフ",
    fatNote: "引き潮前の「間」。霜降りを楽しむ日。",
  },
};

const PHASE_LABELS: Record<TidePhase, string> = {
  high: "満潮寄り",
  ebbing: "引き始め",
  low: "干潮寄り",
  rising: "満ち向かい",
};

const MOON_LABELS = [
  "新月",
  "三日月",
  "上弦",
  "十三夜",
  "満月",
  "居待月",
  "下弦",
  "有明",
];

function tidePhaseFromDate(date: Date): TidePhase {
  const phases: TidePhase[] = ["high", "ebbing", "low", "rising"];
  const index =
    (date.getDate() + date.getMonth() * 3 + Math.floor(date.getHours() / 6)) %
    phases.length;
  return phases[index];
}

function moonLabelFromDate(date: Date): string {
  const day = date.getDate();
  const index = Math.min(MOON_LABELS.length - 1, Math.floor((day - 1) / 4));
  return MOON_LABELS[index];
}

/** 東京湾岸を想定した「潮カード」用の今日の一枚（デモ用ロジック） */
export function getTideRecommendation(forDate: Date = new Date()): TideRecommendation {
  const phase = tidePhaseFromDate(forDate);
  const base = CUTS[phase];
  return {
    phase,
    phaseLabel: PHASE_LABELS[phase],
    moonLabel: moonLabelFromDate(forDate),
    ...base,
  };
}
