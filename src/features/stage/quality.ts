export type QualityTier = "high" | "medium" | "low";

export type Quality = Readonly<{
  tier: QualityTier;
  maxDpr: number;
  minDpr: number;
  oceanRings: number;
  oceanSegments: number;
  multisampling: number;
  mistCount: number;
  thetaSegments: number;
  reflectionScale: number;
}>;

const QUALITY: Readonly<Record<QualityTier, Quality>> = {
  high: {
    tier: "high",
    maxDpr: 2,
    minDpr: 1,
    oceanRings: 220,
    oceanSegments: 288,
    multisampling: 4,
    mistCount: 700,
    thetaSegments: 192,
    reflectionScale: 0.5,
  },
  medium: {
    tier: "medium",
    maxDpr: 1.5,
    minDpr: 0.9,
    oceanRings: 160,
    oceanSegments: 200,
    multisampling: 2,
    mistCount: 450,
    thetaSegments: 160,
    reflectionScale: 0.4,
  },
  low: {
    tier: "low",
    maxDpr: 1.5,
    minDpr: 0.75,
    oceanRings: 110,
    oceanSegments: 144,
    multisampling: 0,
    mistCount: 260,
    thetaSegments: 128,
    reflectionScale: 0.35,
  },
};

export function detectQuality(): Quality {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const shortSide = Math.min(window.screen.width, window.screen.height);
  const cores = navigator.hardwareConcurrency ?? 4;
  if (coarse || shortSide < 700) return QUALITY.low;
  if (cores <= 4) return QUALITY.medium;
  return QUALITY.high;
}
