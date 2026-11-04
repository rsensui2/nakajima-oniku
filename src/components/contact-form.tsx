"use client";

import { useState } from "react";
import { cookingMethodLabels, type InquiryInput } from "@/lib/inquiry-schema";

type FormState = "idle" | "submitting" | "success" | "error";

const initial: InquiryInput = {
  name: "",
  email: "",
  phone: "",
  partySize: 2,
  cookingMethod: "steak",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<InquiryInput>(initial);
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "送信に失敗しました。時間をおいて再度お試しください。");
        setState("error");
        return;
      }

      setState("success");
      setForm(initial);
    } catch {
      setErrorMessage("通信エラーが発生しました。");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div
        className="rounded-2xl border border-tide/20 bg-white p-8 text-center shadow-sm"
        role="status"
      >
        <p className="text-lg font-bold text-sea">送信ありがとうございました</p>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          ご入力のメールアドレスへ確認メールをお送りしました。
          <br />
          中島より、潮カレンダーに沿ったご提案を順次ご連絡します。
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-6 text-sm font-medium text-tide underline-offset-4 hover:underline"
        >
          続けて申込する
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-sea/10 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">お名前 *</span>
          <input
            required
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-sea/15 bg-sand/30 px-3 py-2.5 text-ink outline-none focus:border-tide focus:ring-2 focus:ring-tide/20"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">メールアドレス *</span>
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-sea/15 bg-sand/30 px-3 py-2.5 text-ink outline-none focus:border-tide focus:ring-2 focus:ring-tide/20"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">電話番号（任意）</span>
          <input
            type="tel"
            name="phone"
            value={form.phone ?? ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-sea/15 bg-sand/30 px-3 py-2.5 text-ink outline-none focus:border-tide focus:ring-2 focus:ring-tide/20"
            autoComplete="tel"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">人数 *</span>
          <input
            required
            type="number"
            min={1}
            max={20}
            name="partySize"
            value={form.partySize}
            onChange={(e) => setForm({ ...form, partySize: Number(e.target.value) })}
            className="mt-1.5 w-full rounded-lg border border-sea/15 bg-sand/30 px-3 py-2.5 text-ink outline-none focus:border-tide focus:ring-2 focus:ring-tide/20"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink">調理の想定 *</span>
        <select
          name="cookingMethod"
          value={form.cookingMethod}
          onChange={(e) =>
            setForm({
              ...form,
              cookingMethod: e.target.value as InquiryInput["cookingMethod"],
            })
          }
          className="mt-1.5 w-full rounded-lg border border-sea/15 bg-sand/30 px-3 py-2.5 text-ink outline-none focus:border-tide focus:ring-2 focus:ring-tide/20"
        >
          {(Object.entries(cookingMethodLabels) as [InquiryInput["cookingMethod"], string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink">ご希望・ご質問 *</span>
        <textarea
          required
          name="message"
          rows={5}
          placeholder="希望の部位、日時、アレルギー、贈答用途など"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="mt-1.5 w-full resize-y rounded-lg border border-sea/15 bg-sand/30 px-3 py-2.5 text-ink outline-none focus:border-tide focus:ring-2 focus:ring-tide/20"
        />
      </label>

      {state === "error" && errorMessage && (
        <p className="text-sm text-coral" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full rounded-full bg-coral py-3.5 text-sm font-bold text-white shadow-lg shadow-coral/25 transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {state === "submitting" ? "送信中…" : "申込を送信する"}
      </button>
    </form>
  );
}
