type Props = Readonly<{
  illumination: number;
  waxing: boolean;
  size?: number;
  className?: string;
}>;

/** 輝面比から描く月の形。満ちていく月は右、欠けていく月は左が光る。 */
export function MoonGlyph({ illumination, waxing, size = 72, className }: Props) {
  const r = size / 2 - 2;
  const k = Math.min(1, Math.max(0, illumination));
  const rx = Math.abs(1 - 2 * k) * r;
  const terminatorSweep = k < 0.5 ? 0 : 1;
  const lit = `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx} ${r} 0 0 ${terminatorSweep} 0 ${-r} Z`;
  return (
    <svg
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`輝面比 ${Math.round(k * 100)}%`}
    >
      <circle r={r} fill="rgba(243,234,215,0.05)" stroke="rgba(243,234,215,0.28)" strokeWidth={0.75} />
      <path d={lit} fill="#f3ead7" transform={waxing ? undefined : "scale(-1,1)"} />
    </svg>
  );
}
