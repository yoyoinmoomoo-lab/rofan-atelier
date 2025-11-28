"use client";

import { useMemo } from "react";
import { getUIText } from "../i18n/uiText";
import { getInitialLang } from "../utils/langUtils";
import type { LangCode } from "../types";

/**
 * Suspense fallback용 로딩 컴포넌트
 * 
 * 사용자의 언어 설정(URL 쿼리 또는 localStorage)을 읽어서
 * 해당 언어로 로딩 메시지를 표시합니다.
 * 
 * Suspense fallback 내부에서는 useSearchParams를 사용할 수 없으므로,
 * window.location을 직접 읽어서 URL 쿼리 파라미터를 가져옵니다.
 */
export default function LoadingFallback() {
  // URL 쿼리에서 lang 읽기 (클라이언트 사이드에서만)
  const urlLang = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get("lang");
    } catch {
      return null;
    }
  }, []);
  
  // localStorage에서 lang 읽기 (클라이언트 사이드에서만)
  const storageLang = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("lang");
  }, []);
  
  // 언어 결정: URL > localStorage > 기본값 "ko"
  const lang: LangCode = getInitialLang(urlLang, storageLang);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] items-center justify-center">
      <div className="text-[var(--text-muted)]">
        {getUIText("commonLoading", lang)}
      </div>
    </div>
  );
}

