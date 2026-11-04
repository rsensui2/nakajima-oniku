import Link from "next/link";

export function HomeFooter() {
  return (
    <footer className="relative z-10 border-t border-moon/10 bg-abyss">
      <div className="mx-auto grid max-w-[1680px] gap-12 px-5 py-16 sm:px-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-serif text-sm italic tracking-[0.16em] text-moon/50">Nakajima Tide Cut</p>
          <p className="mt-2 font-mincho text-2xl tracking-[0.3em] text-moon">潮待熟成 中島</p>
          <p className="mt-5 max-w-sm text-sm leading-loose text-moon/60">
            千葉県出身・中島が切る、湾岸熟成の精肉店。実店舗はオープン準備中です。事前申込とご相談はフォームから受け付けています。
          </p>
        </div>
        <nav className="flex flex-col gap-3 text-sm text-moon/70" aria-label="サイト内リンク">
          <a href="#tide" className="transition-colors hover:text-moon">今日の潮</a>
          <Link href="/concept" className="transition-colors hover:text-moon">コンセプト</Link>
          <Link href="/apply" className="transition-colors hover:text-moon">事前申込フォーム</Link>
          <a href="/docs/planning-overview.html" className="transition-colors hover:text-moon">企画概要（HTML）</a>
        </nav>
        <div className="font-mono text-[0.68rem] leading-relaxed tracking-[0.08em] text-moon/60">
          <p>潮位：気象庁「潮位表」東京（TK）の調和定数（2026年版・主要25分潮）からブラウザ内で推算。</p>
          <p className="mt-3">月齢：Meeus の月・太陽黄経の主要項から計算。潮名は正午月齢による目安です。</p>
          <p className="mt-3">実際の切り口は、申込内容と在庫で中島が確定します。</p>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1680px] items-center justify-between border-t border-moon/10 px-5 py-6 font-mono text-[0.65rem] tracking-[0.18em] text-moon/55 sm:px-10">
        <span>© 2026 NAKAJIMA TIDE CUT</span>
        <span>CHIBA · TOKYO BAY</span>
      </div>
    </footer>
  );
}
