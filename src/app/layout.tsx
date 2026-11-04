import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans_JP({
  variable: "--nf-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const mincho = Shippori_Mincho({
  variable: "--nf-mincho",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--nf-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const serif = Cormorant_Garamond({
  variable: "--nf-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

/** Vercel のビルドでは本番ドメインが入る（OGP 画像などの絶対 URL 用） */
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const metadataBase = new URL(productionHost ? `https://${productionHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "潮待熟成 中島 | NAKAJIMA TIDE CUT",
    template: "%s | 潮待熟成 中島",
  },
  description:
    "東京湾の潮位と月齢を読み、その日の一枚だけを切る。千葉の熟成肉店「潮待熟成 中島」。事前申込受付中。",
  openGraph: {
    title: "潮待熟成 中島 | NAKAJIMA TIDE CUT",
    description: "潮が満ちる日に、切り口は一枚だけ。東京湾の潮を読む、千葉の熟成肉店。",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "潮待熟成 中島 | NAKAJIMA TIDE CUT",
    description: "潮が満ちる日に、切り口は一枚だけ。東京湾の潮を読む、千葉の熟成肉店。",
  },
};

export const viewport: Viewport = {
  themeColor: "#04070a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonts = [sans.variable, mincho.variable, mono.variable, serif.variable].join(" ");
  return (
    <html lang="ja" className={`${fonts} h-full antialiased`}>
      <body className="min-h-full">
        <noscript>
          <style>{`.split-char > span, .rise, .draw-line { opacity: 1 !important; transform: none !important; filter: none !important; } header { opacity: 1 !important; }`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
