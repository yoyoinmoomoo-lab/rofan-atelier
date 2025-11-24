import type { Metadata } from "next";
import { Playfair_Display, Inter, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSerif = Noto_Serif_KR({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "로판 네임 아틀리에",
  description: "당신의 세계를 위한 이름과 가문을 만듭니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${playfair.variable} ${inter.variable} ${notoSans.variable} ${notoSerif.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
