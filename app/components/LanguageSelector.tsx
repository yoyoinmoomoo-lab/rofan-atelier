import type { LangCode } from "../types";
import { LANGUAGES } from "../constants";

interface LanguageSelectorProps {
  currentLang: LangCode;
  onChange: (lang: LangCode) => void;
  currentPage: "given" | "family";
}

/**
 * 언어 선택 컴포넌트
 * 
 * 언어 변경 시 Google Analytics 이벤트를 전송합니다.
 */
export default function LanguageSelector({ 
  currentLang, 
  onChange, 
  currentPage 
}: LanguageSelectorProps) {
  const handleLanguageChange = (newLang: LangCode) => {
    // 같은 언어를 선택한 경우 이벤트 전송하지 않음
    if (newLang === currentLang) {
      return;
    }

    // Google Analytics 이벤트 전송
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "language_change", {
        lang_from: currentLang,
        lang_to: newLang,
        location: "header_language_selector",
        page: currentPage,
      });
    }

    // 언어 변경 실행
    onChange(newLang);
  };

  return (
    <div className="flex gap-2">
      {LANGUAGES.map((language) => {
        const isActive = language.code === currentLang;
        return (
          <button
            key={language.code}
            type="button"
            className={`min-w-[100px] px-4 py-2 text-sm rounded-full border transition text-center ${
              isActive
                ? "bg-[var(--accent)] text-white border-transparent"
                : "bg-transparent text-[var(--accent)] border-[var(--accent)]/60 hover:border-[var(--accent)]"
            }`}
            onClick={() => handleLanguageChange(language.code)}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}

