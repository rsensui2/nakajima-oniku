const DIGITS = Array.from({ length: 10 }, (_, d) => d);

function Digit({ char }: { char: string }) {
  if (!/[0-9]/.test(char)) return <span>{char}</span>;
  const n = Number(char);
  return (
    <span className="relative inline-block h-[1em] overflow-hidden leading-none">
      <span
        className="block transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateY(${-n * 10}%)` }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1em] leading-none">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/** 桁ごとに縦に回って値が変わる数字。負の値は符号を先頭に付ける（潮位は基準面より下がることがある）。 */
export function Odometer({ value, pad = 0, className }: { value: number; pad?: number; className?: string }) {
  const rounded = Math.round(value);
  const negative = rounded < 0;
  const digits = String(Math.abs(rounded)).padStart(pad, "0");
  return (
    <span className={`inline-flex tabular ${className ?? ""}`}>
      <span className="sr-only">{String(rounded)}</span>
      <span aria-hidden className="inline-flex">
        {negative && <span>−</span>}
        {Array.from(digits).map((ch, i) => (
          <Digit key={`${digits.length}-${i}`} char={ch} />
        ))}
      </span>
    </span>
  );
}
