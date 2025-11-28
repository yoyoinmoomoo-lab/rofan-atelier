import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { Playfair_Display, Inter, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { getUIText } from "./i18n/uiText";
import { getResources } from "./i18n/resources";
import type { LangCode } from "./types";
import { GENERATION_PROFILES } from "@/config/generationProfile";

/**
 * 지원되는 언어인지 확인
 */
function isSupportedLang(value: unknown): value is LangCode {
  return typeof value === "string" && value in GENERATION_PROFILES;
}

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

/**
 * 서버 사이드에서 현재 언어 결정
 * 쿠키에서 lang을 읽거나, 기본값 "ko" 사용
 * 
 * 참고: 클라이언트에서 언어 변경 시 쿠키도 함께 업데이트해야
 * 서버 사이드 렌더링에서 올바른 언어를 사용할 수 있습니다.
 */
async function getLangFromServer(): Promise<LangCode> {
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang");
    
    if (langCookie && isSupportedLang(langCookie.value)) {
      return langCookie.value;
    }
  } catch (error) {
    // 쿠키 읽기 실패 시 기본값 사용
  }
  return "ko";
}

/**
 * 동적 메타데이터 생성
 * 현재 언어에 따라 다른 메타데이터 제공
 * 
 * 서버 사이드에서 쿠키를 읽어 언어를 결정하고,
 * 해당 언어에 맞는 메타데이터를 생성합니다.
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLangFromServer();
  const resources = getResources(lang);
  const locale = lang === "ko" ? "ko_KR" : "en_US";

  return {
    title: getUIText("metaTitle", lang),
    description: getUIText("metaDescription", lang),
    metadataBase: new URL("https://rofan.world"),
    openGraph: {
      title: getUIText("metaOgTitle", lang),
      description: getUIText("metaOgDescription", lang),
      url: "https://rofan.world",
      siteName: getUIText("metaOgTitle", lang),
      images: [
        {
          url: resources.ogImage,
          width: 1200,
          height: 630,
        },
      ],
      locale: locale,
      type: "website",
      alternateLocale: lang === "ko" ? "en_US" : "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title: getUIText("metaTwitterTitle", lang),
      description: getUIText("metaTwitterDescription", lang),
      images: [resources.ogImage],
    },
    icons: {
      icon: [
        { url: resources.favicon, rel: "icon", sizes: "any" },
        { url: resources.favicon16, type: "image/png", sizes: "16x16" },
        { url: resources.favicon32, type: "image/png", sizes: "32x32" },
      ],
      apple: [{ url: resources.appleTouchIcon, sizes: "180x180" }],
    },
    manifest: resources.manifest,
    alternates: {
      languages: {
        ko: "https://rofan.world?lang=ko",
        en: "https://rofan.world?lang=en",
      },
      canonical: "https://rofan.world",
    },
  };
}

/**
 * 루트 레이아웃 컴포넌트
 * 언어에 따라 html lang 속성과 리소스 경로를 동적으로 설정
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLangFromServer();
  const resources = getResources(lang);
  const htmlLang = lang === "ko" ? "ko" : "en";

  return (
    <html lang={htmlLang}>
      <head>
        <link rel="icon" href={resources.favicon} sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href={resources.favicon16} />
        <link rel="icon" type="image/png" sizes="32x32" href={resources.favicon32} />
        <link rel="apple-touch-icon" sizes="180x180" href={resources.appleTouchIcon} />
        <link rel="manifest" href={resources.manifest} />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-4G5ML90JFM" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4G5ML90JFM');
          `}
        </Script>
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} ${notoSans.variable} ${notoSerif.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
