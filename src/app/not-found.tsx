import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-sand text-ink">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-24">
        <p className="text-xs font-semibold tracking-[0.25em] text-tide">404 — NOT FOUND</p>
        <h1 className="mt-3 font-mincho text-3xl font-bold text-sea">この潮目には、何もありませんでした。</h1>
        <p className="mt-6 leading-relaxed text-muted">お探しのページは見つかりませんでした。トップページから今日の潮をご覧ください。</p>
        <p className="mt-10">
          <Link href="/" className="inline-flex rounded-full bg-sea px-8 py-3 text-sm font-bold text-foam transition hover:bg-tide">
            トップへ戻る
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
