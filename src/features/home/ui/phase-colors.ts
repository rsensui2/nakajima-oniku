import type { TidePhase } from "@/features/tide/cuts";

export const PHASE_COLOR: Readonly<Record<TidePhase, string>> = {
  rising: "#5fb4c4",
  high: "#f3ead7",
  ebbing: "#e8735a",
  low: "#3f7f91",
};
