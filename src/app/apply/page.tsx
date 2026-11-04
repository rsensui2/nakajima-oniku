import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "事前申込",
  description: "潮待熟成 中島への事前申込・ご相談フォーム。",
};

export default function ApplyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <p className="text-xs font-semibold tracking-[0.25em] text-tide">APPLICATION</p>
      <h1 className="mt-3 text-3xl font-bold text-sea">事前申込</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        ご希望の部位・人数・調理法をお知らせください。送信後、ご入力のメールアドレスへ自動返信します。
        店舗からのご提案は、中島より順次ご連絡いたします。
      </p>
      <div className="mt-10">
        <ContactForm />
      </div>
    </main>
  );
}
