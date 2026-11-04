import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "コンセプト",
  description: "潮待熟成 中島のコンセプト — 東京湾の潮位で肉と出会う。",
};

export default function ConceptPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-xs font-semibold tracking-[0.25em] text-tide">CONCEPT</p>
      <h1 className="mt-3 text-3xl font-bold text-sea">潮のリズムで、肉を選ぶ</h1>
      <p className="mt-6 leading-relaxed text-muted">
        スーパーの精肉コーナーは、いつでも同じ並び。潮待熟成
        中島は違います。東京湾の潮位と月齢を「味のカレンダー」にし、その日に最も旨味が読みやすい部位だけを切ります。
      </p>

      <div className="mt-10 space-y-8">
        <article className="rounded-2xl border border-sea/10 bg-white p-6">
          <h2 className="text-lg font-bold text-sea">なぜ千葉なのか</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            店主・中島は千葉県出身。海側の湿気、浜風、湾岸の生活感は、熟成環境の設計そのものです。
            産地のストーリーだけでなく、気候としての千葉を店の軸に据えています。
          </p>
        </article>
        <article className="rounded-2xl border border-sea/10 bg-white p-6">
          <h2 className="text-lg font-bold text-sea">一枚切り出し</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            大量陳列はしません。申込内容（人数・調理法・希望）と、その日の潮カードを照合し、中島が一枚を確定します。
            肉を「買う」より、切り口を「受け取る」体験を目指します。
          </p>
        </article>
        <article className="rounded-2xl border border-sea/10 bg-white p-6">
          <h2 className="text-lg font-bold text-sea">付属するもの</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted">
            <li>潮位メモ（その日の phase とおすすめの理由）</li>
            <li>切り方の一枚絵</li>
            <li>火入れの目安（霜降り／赤身に合わせた短い指示）</li>
          </ul>
        </article>
      </div>

      <p className="mt-12 text-center">
        <Link
          href="/apply"
          className="inline-flex rounded-full bg-sea px-8 py-3 text-sm font-bold text-foam transition hover:bg-tide"
        >
          事前申込はこちら
        </Link>
      </p>
    </main>
  );
}
