type Props = Readonly<{
  items: readonly string[];
  duration?: number;
  className?: string;
}>;

/** 途切れずに流れるテロップ（同じ列を2本並べて半分ずらす） */
export function Marquee({ items, duration = 48, className }: Props) {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="flex items-center whitespace-nowrap">
          <span className="px-6">{item}</span>
          <span className="h-1 w-1 rounded-full bg-ember/80" aria-hidden />
        </span>
      ))}
    </div>
  );
  return (
    <div aria-hidden className={`marquee relative overflow-hidden border-y border-moon/10 bg-abyss/55 py-3 ${className ?? ""}`}>
      <div className="marquee-track flex w-max" style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
