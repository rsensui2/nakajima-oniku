/** 35.65 → 35°39′N */
export function formatCoordinate(value: number, hemisphere: "N" | "E"): string {
  const deg = Math.floor(value);
  const min = Math.round((value - deg) * 60);
  return `${deg}°${String(min).padStart(2, "0")}′${hemisphere}`;
}

export function formatLevel(cm: number): string {
  return `${Math.round(cm)}`;
}

export function trendArrow(rate: number): string {
  if (Math.abs(rate) < 2) return "→";
  return rate > 0 ? "↗" : "↘";
}

export function trendLabel(rate: number): string {
  if (Math.abs(rate) < 2) return "潮止まり";
  return rate > 0 ? "上げ潮" : "下げ潮";
}
