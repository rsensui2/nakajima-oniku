const DIGITS = Array.from({ length: 10 }, (_, d) => d);

function Digit({ char }: { char: string }) {
  if (!/[0-9]/.test(char)) return <span aria-hidden>{char}</span>;
  const n = Number(char);
  return (
    <span aria-hidden className="relative inline-block h-[1em] overflow-hidden leading-none">
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

/** 桁ごとに縦に回って値が変わる数字 */
export function Odometer({ value, pad = 0, className }: { value: number; pad?: number; className?: string }) {
  const text = String(Math.round(value)).padStart(pad, "0");
  return (
    <span className={`inline-flex tabular ${className ?? ""}`} aria-label={text} role="text">
      {Array.from(text).map((ch, i) => (
        <Digit key={`${text.length}-${i}`} char={ch} />
      ))}
    </span>
  );
}
