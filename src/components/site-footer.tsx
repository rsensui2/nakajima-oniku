import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-sea/10 bg-sea text-foam">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-widest text-foam/70">潮待熟成 中島</p>
            <p className="mt-2 max-w-sm text-sm text-foam/85 leading-relaxed">
              千葉県出身・中島が切る、湾岸熟成の精肉店。実店舗オープン準備中。事前申込・ご相談はフォームより。
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/concept" className="text-foam/90 hover:text-white">
              コンセプト
            </Link>
            <Link href="/apply" className="text-foam/90 hover:text-white">
              申込フォーム
            </Link>
            <Link href="/docs/planning-overview.html" className="text-foam/90 hover:text-white">
              企画概要（HTML）
            </Link>
          </div>
        </div>
        <p className="mt-10 text-xs text-foam/50">
          © 2026 潮待熟成 中島 — Chiba · Tokyo Bay
        </p>
      </div>
    </footer>
  );
}
