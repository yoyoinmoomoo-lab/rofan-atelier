import type { LangCode } from "@/app/types";

/**
 * 언어별 리소스(이미지, 파일, 링크) 관리
 * 
 * 현재는 모든 언어가 동일한 리소스를 사용하지만,
 * 향후 언어별로 다른 리소스를 사용하려면:
 * 
 * 예시:
 * ko: { ogImage: "/ogimage-ko.png", favicon: "/favicon-ko.png" }
 * en: { ogImage: "/ogimage-en.png", favicon: "/favicon-en.png" }
 * 
 * 이렇게 분리하면 됩니다.
 */
export const RESOURCES = {
  ko: {
    ogImage: "/ogimage.png",
    favicon: "/favicon.ico",
    favicon16: "/favicon-16x16.png",
    favicon32: "/favicon-32x32.png",
    appleTouchIcon: "/apple-touch-icon.png",
    manifest: "/site.webmanifest",
  },
  en: {
    ogImage: "/ogimage.png",
    favicon: "/favicon.ico",
    favicon16: "/favicon-16x16.png",
    favicon32: "/favicon-32x32.png",
    appleTouchIcon: "/apple-touch-icon.png",
    manifest: "/site.webmanifest",
  },
} as const;

/**
 * 언어 코드에 해당하는 리소스 가져오기
 */
export function getResources(lang: LangCode) {
  return RESOURCES[lang];
}

