import type { Metadata } from "next";
import { Outfit, Work_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ADHOLIC — 用 AI 打造你的網站",
  description: "AI 驅動的網站製作平台。從草稿到上線，一句話搞定。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-TW" className={`${outfit.variable} ${workSans.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
