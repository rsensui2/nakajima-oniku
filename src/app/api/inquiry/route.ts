import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  cookingMethodLabels,
  inquirySchema,
} from "@/lib/inquiry-schema";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function fromAddress() {
  return process.env.RESEND_FROM ?? "潮待熟成 中島 <rsensui@tekion.jp>";
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "不正なリクエストです。" }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "入力内容を確認してください。";
    return NextResponse.json({ ok: false, error: first }, { status: 400 });
  }

  const data = parsed.data;
  const resend = getResend();
  if (!resend) {
    return NextResponse.json(
      { ok: false, error: "メール送信の設定が完了していません（RESEND_API_KEY）。" },
      { status: 503 },
    );
  }

  const cooking = cookingMethodLabels[data.cookingMethod];
  const ownerTo = process.env.INQUIRY_NOTIFY_EMAIL;

  const userHtml = `
    <p>${data.name} 様</p>
    <p>潮待熟成 中島へのお申込み、ありがとうございます。</p>
    <p>以下の内容で受け付けました。中島より、潮カレンダーに沿ったご提案を順次ご連絡いたします。</p>
    <hr />
    <p><strong>人数：</strong>${data.partySize} 名</p>
    <p><strong>調理の想定：</strong>${cooking}</p>
    <p><strong>ご希望：</strong><br />${data.message.replace(/\n/g, "<br />")}</p>
    <hr />
    <p style="color:#666;font-size:12px;">潮待熟成 中島 · 千葉発</p>
  `;

  const { error: userError } = await resend.emails.send({
    from: fromAddress(),
    to: [data.email],
    subject: "【潮待熟成 中島】お申込みありがとうございます",
    html: userHtml,
  });

  if (userError) {
    console.error("Resend user email error:", userError);
    return NextResponse.json(
      { ok: false, error: "確認メールの送信に失敗しました。" },
      { status: 502 },
    );
  }

  if (ownerTo) {
    const ownerHtml = `
      <p>新規申込</p>
      <p><strong>名前：</strong>${data.name}</p>
      <p><strong>メール：</strong>${data.email}</p>
      <p><strong>電話：</strong>${data.phone || "—"}</p>
      <p><strong>人数：</strong>${data.partySize}</p>
      <p><strong>調理：</strong>${cooking}</p>
      <p><strong>内容：</strong><br />${data.message.replace(/\n/g, "<br />")}</p>
    `;
    await resend.emails.send({
      from: fromAddress(),
      to: [ownerTo],
      subject: `【申込】${data.name} 様`,
      html: ownerHtml,
    });
  }

  return NextResponse.json({ ok: true });
}
