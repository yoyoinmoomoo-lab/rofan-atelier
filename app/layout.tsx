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
  title: "Rofan Atelier – 로맨스 판타지 세계관 이름 생성기",
  description:
    "로맨스 판타지 세계를 위한 이름과 가문명을 빚어드립니다. 서양식 이름, 귀족 가문명, 세계관 설정까지 한 번에.",
  metadataBase: new URL("https://rofan.world"),
  openGraph: {
    title: "Rofan Atelier",
    description: "당신의 이야기 속 인물들의 이름과 가문명을 찾아드립니다.",
    url: "https://rofan.world",
    siteName: "Rofan Atelier",
    images: [
      {
        url: "/og-rofan.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rofan Atelier",
    description: "한국 웹소설 작가를 위한 로맨스 판타지 이름·가문 생성 도구.",
    images: ["/og-rofan.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", rel: "icon", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} ${notoSans.variable} ${notoSerif.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
