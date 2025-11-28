"use client";

import { useEffect, useState } from "react";
import type {
  Class as ClassType,
  Culture,
  Era,
  FamilyResult,
  GenerateFamiliesRequest,
  LangCode,
} from "../types";
import { CULTURE_OPTIONS, CLASS_OPTIONS, ERA_OPTIONS } from "../constants";
import LoadingSpinner from "./LoadingSpinner";
import { trackGtagEvent } from "../../lib/gtag";
import { getDisplayClassLabel } from "../utils/getDisplayClassLabel";
import { getUIText } from "../i18n/uiText";

interface FamilyGeneratorProps {
  onCopy: (message: string) => void;
  lang: LangCode;
}

// 중복 제거를 위한 키 생성 함수
const getFamilyKey = (family: FamilyResult) => `${family.korean}-${family.roman}`;

const getDisplayFamilyName = (lang: LangCode, korean: string, roman: string) =>
  lang === "en" ? roman : `${korean} / ${roman}`;

export default function FamilyGenerator({ onCopy, lang }: FamilyGeneratorProps) {
  const [formData, setFormData] = useState<GenerateFamiliesRequest>({
    culture: "france",
    class: "noble",
    era: "romantic",
  });
  const [families, setFamilies] = useState<FamilyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFamilies([]);
    setError(null);
  }, [lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackGtagEvent("click_generate_family", "generate_button", "generate_10_family_names");
    setLoading(true);
    setError(null);

    try {
      const requestBody = { ...formData, lang };
      const response = await fetch("/api/generate-families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(getUIText("errorGenerateFamilies", lang));
      }

      const data = await response.json();
      setFamilies(data.families || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : getUIText("errorGenerateFamilies", lang));
    } finally {
      setLoading(false);
    }
  };

  const copyFamily = (family: FamilyResult) => {
    const displayName = getDisplayFamilyName(lang, family.korean, family.roman);
    navigator.clipboard.writeText(displayName);
    onCopy(getUIText("copySuccessMessage", lang));
  };

  const copyFull = (family: FamilyResult) => {
    const displayName = getDisplayFamilyName(lang, family.korean, family.roman);
    const classLabel = getDisplayClassLabel(lang, formData.class);
    const text = `${displayName} · ${classLabel}\n${getUIText("keywordsLabel", lang)} ${family.keywords.join(", ")}\n${getUIText("descriptionLabel", lang)} ${family.desc}`;
    navigator.clipboard.writeText(text);
    onCopy(getUIText("copySuccessMessage", lang));
  };

  return (
    <div className="space-y-8">
      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {getUIText("cultureLabel", lang)}
            </label>
            <select
              value={formData.culture}
              onChange={(e) =>
                setFormData({ ...formData, culture: e.target.value as Culture })
              }
              className="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {CULTURE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label[lang] ?? opt.label.ko}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {getUIText("classLabel", lang)}
            </label>
            <select
              value={formData.class}
              onChange={(e) =>
                setFormData({ ...formData, class: e.target.value as ClassType })
              }
              className="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {CLASS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label[lang] ?? opt.label.ko}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {getUIText("eraLabel", lang)}
            </label>
            <select
              value={formData.era}
              onChange={(e) => setFormData({ ...formData, era: e.target.value as Era })}
              className="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {ERA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label[lang] ?? opt.label.ko}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? getUIText("generatingText", lang) : getUIText("generateFamiliesButton", lang)}
        </button>
      </form>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {loading && <LoadingSpinner />}

      {/* 결과 리스트 - 단일 열 리스트형 */}
      {!loading && families.length > 0 && (
        <div className="space-y-4">
          {families.map((family, index) => (
            <div
              key={`${getFamilyKey(family)}-${index}`}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div>
                    <span className="font-serif text-lg font-semibold text-foreground">
                      {getDisplayFamilyName(lang, family.korean, family.roman)}
                    </span>
                    <span className="ml-2 text-xs text-[var(--accent)]">
                      · {getDisplayClassLabel(lang, formData.class)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {family.keywords.map((keyword, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs bg-[var(--accent-light)]/20 text-foreground rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>

                  <div className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {family.desc}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyFamily(family)}
                    className="px-4 py-2 text-sm border border-[var(--card-border)] rounded-lg hover:bg-[var(--accent-light)]/20 transition-colors whitespace-nowrap"
                  >
                    {getUIText("copyFamilyButton", lang)}
                  </button>
                  <button
                    onClick={() => copyFull(family)}
                    className="px-4 py-2 text-sm border border-[var(--card-border)] rounded-lg hover:bg-[var(--accent-light)]/20 transition-colors whitespace-nowrap"
                  >
                    {getUIText("copyFullButton", lang)}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

