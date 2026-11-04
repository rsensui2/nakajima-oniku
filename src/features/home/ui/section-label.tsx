type Props = Readonly<{
  index: string;
  ja: string;
  en: string;
  className?: string;
}>;

/** 「02 ── 一枚切り THE CUT」形式の小見出し */
export function SectionLabel({ index, ja, en, className }: Props) {
  return (
    <p className={`flex items-center gap-3 font-mono text-[0.66rem] tracking-[0.28em] text-moon/60 ${className ?? ""}`}>
      <span className="text-ember">{index}</span>
      <span className="draw-line h-px w-10 bg-moon/40" />
      <span className="font-mincho text-[0.78rem] tracking-[0.35em] text-moon/85">{ja}</span>
      <span className="hidden sm:inline">{en}</span>
    </p>
  );
}
