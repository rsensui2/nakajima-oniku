import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "潮待熟成 中島 | NAKAJIMA TIDE CUT",
    template: "%s | 潮待熟成 中島",
  },
  description:
    "千葉発・東京湾の潮に合わせて切る熟成肉。千葉県出身・中島の精肉店。事前申込受付中。",
  openGraph: {
    title: "潮待熟成 中島",
    description: "潮のリズムで肉と出会う、千葉発の精肉店。",
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-sand text-ink">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
