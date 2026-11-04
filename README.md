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

## トップページの仕組み

トップページは、画面全体に固定した WebGL（three.js）の舞台と、その上を流れる DOM のセクションでできています。
スクロール位置を「ストーリー位置 S」（セクション番号 + セクション内の進み）に変換し、3D の演出と DOM の演出はどちらも S だけを見て動きます。

| 場所 | 役割 |
|------|------|
| `src/features/tide/` | 潮汐と月の計算（純粋関数・テストあり）。気象庁「分潮一覧表 東京」の調和定数から潮位を推算し、Meeus の式で月齢を出す |
| `src/features/stage/` | WebGL の舞台。夜の海（Gerstner 波）・実際の月相の月・手続き生成の霜降り肉・海図への変形・ポストエフェクト |
| `src/features/stage/director.ts` | S → カメラ・肉・光・霧の状態を決めるキーフレーム（演出の台本） |
| `src/features/stage/story.ts` | セクションの並びと高さ（DOM と 3D で共有） |
| `src/features/home/` | トップページの React 部品（セクション、読み込み演出、潮位グラフ、潮騒の音） |

- 潮位の精度：2026年の気象庁の毎時潮位（8,760点）に対して RMS 1.85cm・最大 6.4cm（主要25分潮）
- 「いま切るなら」の部位は、実際の満潮・干潮の時刻から局面（満ち潮・満潮・引き潮・干潮）を判定して決める
- three.js 一式はトップページの表示後に動的 import する。WebGL2 が使えない環境では静止画の背景に切り替わる
- `prefers-reduced-motion` では慣性スクロール・読み込み演出・文字の出現アニメーションを止める

```bash
npm test        # 潮汐・月齢・局面判定のテスト（vitest）
```

## 企画概要

`docs/planning-overview.html` または `/docs/planning-overview.html`（本番）

## デプロイ

- GitHub でソース管理
- Vercel に `RESEND_API_KEY` 等を Environment Variables として設定

```bash
npm run build
```
