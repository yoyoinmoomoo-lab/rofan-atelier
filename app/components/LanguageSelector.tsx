import type { LangCode } from "../types";
import { LANGUAGES } from "../constants";

interface LanguageSelectorProps {
  currentLang: LangCode;
  onChange: (lang: LangCode) => void;
}

export default function LanguageSelector({ currentLang, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex gap-2">
      {LANGUAGES.map((language) => {
        const isActive = language.code === currentLang;
        return (
          <button
            key={language.code}
            type="button"
            className={`px-4 py-2 text-sm rounded-full border transition ${
              isActive
                ? "bg-[var(--accent)] text-white border-transparent"
                : "bg-transparent text-[var(--accent)] border-[var(--accent)]/60 hover:border-[var(--accent)]"
            }`}
            onClick={() => onChange(language.code)}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}

