type Props = Readonly<{
  text: string;
  /** 全体の遅延（ms） */
  delay?: number;
  /** 文字ごとの番号の起点（複数行を続けて流すとき） */
  offset?: number;
  className?: string;
}>;

/** 行頭に来てはいけない文字（禁則）。前の文字と一つの塊にして、句読点だけが次の行に落ちるのを防ぐ。 */
const NO_LINE_START = new Set(Array.from("、。，．・：；？！）」』】〕ーぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ"));

function groupGlyphs(text: string): string[] {
  return Array.from(text).reduce<string[]>((acc, ch) => {
    if (acc.length > 0 && NO_LINE_START.has(ch)) {
      return [...acc.slice(0, -1), acc[acc.length - 1] + ch];
    }
    return [...acc, ch];
  }, []);
}

/**
 * 一文字ずつ現れる文字列。読み上げ用に元の文字列を持ち、分割した文字は支援技術から隠す。
 * 親（またはこの要素自身）に .is-in が付くと再生される。
 */
export function SplitText({ text, delay = 0, offset = 0, className }: Props) {
  const glyphs = groupGlyphs(text);
  return (
    <span className={className} aria-label={text} role="text">
      {glyphs.map((g, i) => (
        <span
          key={`${g}-${i}`}
          aria-hidden
          className="split-char"
          style={{ "--i": i + offset, "--d": `${delay}ms` } as React.CSSProperties}
        >
          <span>{g === " " ? " " : g}</span>
        </span>
      ))}
    </span>
  );
}
