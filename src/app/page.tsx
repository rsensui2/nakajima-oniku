import Link from "next/link";
import { TideCard } from "@/components/tide-card";

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-sea/10 bg-gradient-to-b from-foam to-sand">
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-14 sm:pt-20">
          <p className="text-xs font-semibold tracking-[0.3em] text-tide">CHIBA · TOKYO BAY</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-sea sm:text-5xl">
            潮が満ちる日に、
            <br />
            切り口は一枚だけ。
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            千葉県出身・中島が営む「潮待熟成 中島」。
            湾岸の湿気で熟成した肉を、東京湾の潮位と月齢に合わせて一枚ずつ切り出します。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full bg-coral px-7 py-3 text-sm font-bold text-white shadow-lg shadow-coral/20 transition hover:bg-coral/90"
            >
              事前申込
            </Link>
            <Link
              href="/concept"
              className="inline-flex items-center justify-center rounded-full border border-sea/20 bg-white px-7 py-3 text-sm font-bold text-sea transition hover:border-tide"
            >
              コンセプトを読む
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <TideCard />
      </section>

      <section className="border-y border-sea/10 bg-white">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-14 sm:grid-cols-3">
          {[
            {
              title: "潮カレンダー",
              body: "満ち・引き・干潮・満ち向かいの四つに日替わりで「今日の一枚」を提示。均一な陳列ではなく、理由のある推薦。",
            },
            {
              title: "湾岸熟成",
              body: "千葉の海側の湿気を活かした熟成設計。部位ごとに時間と温度を変え、切り口ごとに火入れメモを付けます。",
            },
            {
              title: "中島が切る",
              body: "仕入れから熟成、一枚切りまで一人の職人が担当。匿名ブランドではなく、顔と名前で担保します。",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="text-lg font-bold text-sea">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 text-center">
        <p className="text-sm text-muted">実店舗オープン準備中 — まずは事前申込で「切り口」を予約</p>
        <Link
          href="/apply"
          className="mt-4 inline-block text-sm font-bold text-tide underline-offset-4 hover:underline"
        >
          申込フォームへ →
        </Link>
      </section>
    </main>
  );
}
