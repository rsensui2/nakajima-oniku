# 潮待熟成 中島（NAKAJIMA TIDE CUT）

千葉発・東京湾の潮に合わせて切る熟成肉の Web サイト。Next.js App Router + Resend 申込フォーム。

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local に RESEND_API_KEY を設定
npm run dev
```

[http://localhost:3000](http://localhost:3000)

## 環境変数

| 変数 | 説明 |
|------|------|
| `RESEND_API_KEY` | Resend の API キー（必須） |
| `RESEND_FROM` | 送信元。既定: `潮待熟成 中島 <rsensui@tekion.jp>` |
| `INQUIRY_NOTIFY_EMAIL` | 申込通知の送信先（任意） |

`rsensui@tekion.jp` から送るには、Resend で `tekion.jp` ドメインの DNS 検証が必要です。

## 企画概要

`docs/planning-overview.html` または `/docs/planning-overview.html`（本番）

## デプロイ

- GitHub でソース管理
- Vercel に `RESEND_API_KEY` 等を Environment Variables として設定

```bash
npm run build
```
