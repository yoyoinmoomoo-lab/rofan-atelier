 "use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Tabs from "./components/Tabs";
import NameGenerator from "./components/NameGenerator";
import FamilyGenerator from "./components/FamilyGenerator";
import Toast from "./components/Toast";
import FeedbackBox from "./components/FeedbackBox";
import LanguageSelector from "./components/LanguageSelector";
import LoadingFallback from "./components/LoadingFallback";
import type { LangCode } from "./types";
import { getInitialLang } from "./utils/langUtils";
import { getUIText } from "./i18n/uiText";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"names" | "families">("names");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  
  // 초기 lang 설정: URL > localStorage > 기본값
  const urlLang = searchParams.get("lang");
  const storageLang = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("lang");
  }, []);
  
  const initialLang = useMemo(() => {
    return getInitialLang(urlLang, storageLang);
  }, [urlLang, storageLang]);
  
  const [lang, setLangState] = useState<LangCode>(initialLang);

  // URL 변경 시 lang 동기화
  useEffect(() => {
    const currentUrlLang = searchParams.get("lang");
    const currentStorageLang = typeof window !== "undefined" 
      ? window.localStorage.getItem("lang") 
      : null;
    const newLang = getInitialLang(currentUrlLang, currentStorageLang);
    if (newLang !== lang) {
      setLangState(newLang);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("lang", newLang);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 언어 변경 핸들러: localStorage + URL + 쿠키 업데이트
  const setLang = (newLang: LangCode) => {
    setLangState(newLang);
    
    if (typeof window !== "undefined") {
      // localStorage 저장
      window.localStorage.setItem("lang", newLang);
      
      // 쿠키 저장 (서버 사이드 렌더링에서 사용)
      document.cookie = `lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      
      // URL 쿼리 업데이트 (기존 쿼리 파라미터 보존)
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("lang", newLang);
      router.replace(`?${currentParams.toString()}`, { scroll: false });
    }
  };

  const handleCopy = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      {/* 헤더 */}
      <header className="border-b border-[var(--card-border)]/30 bg-[var(--card-bg)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
            {/* 타이틀 영역 */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
                  {getUIText("appTitle", lang)}
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  Beta
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {getUIText("appSubtitle", lang)}
              </p>
            </div>
            
            {/* 언어 선택 영역 */}
            <div className="flex items-center gap-4">
              <LanguageSelector 
                currentLang={lang} 
                onChange={setLang} 
                currentPage={activeTab === "names" ? "given" : "family"}
              />
              <div className="text-[var(--accent)] text-2xl hidden md:block">✧</div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} lang={lang} />

        {activeTab === "names" ? (
          <NameGenerator lang={lang} onCopy={handleCopy} />
        ) : (
          <FamilyGenerator lang={lang} onCopy={handleCopy} />
        )}

        {/* 피드백 박스 */}
        <section className="mt-12 border-t border-[var(--card-border)]/30 pt-6">
          <FeedbackBox source="rofan-atelier" lang={lang} />
        </section>
      </main>

      {/* Footer - 모델 정보 */}
      <footer className="border-t border-[var(--card-border)]/30 bg-[var(--card-bg)] mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-[var(--text-muted)] text-center">
            {getUIText("footerPoweredBy", lang)}
          </p>
          <p className="text-xs text-[var(--text-muted)] text-center mt-2">
            {getUIText("footerDescription", lang)}
          </p>
        </div>
      </footer>

      {/* 토스트 */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}

/**
 * 루트 페이지 컴포넌트
 * 
 * Suspense fallback에서도 사용자의 언어 설정을 사용하도록
 * LoadingFallback 컴포넌트를 사용합니다.
 * 
 * LoadingFallback은 URL 쿼리 파라미터 또는 localStorage에서
 * 언어를 읽어서 해당 언어로 로딩 메시지를 표시합니다.
 */
export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  );
}
