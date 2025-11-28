"use client";

import { useEffect, useState } from "react";
import type {
  GenerateNamesRequest,
  NameResult,
  Culture,
  Gender,
  Class as ClassType,
  Era,
  LangCode,
} from "../types";
import { CULTURE_OPTIONS, GENDER_OPTIONS, CLASS_OPTIONS, ERA_OPTIONS } from "../constants";
import LoadingSpinner from "./LoadingSpinner";
import { trackGtagEvent } from "../../lib/gtag";
import { getDisplayClassLabel } from "../utils/getDisplayClassLabel";
import { getUIText } from "../i18n/uiText";

interface NameGeneratorProps {
  onCopy: (message: string) => void;
  lang: LangCode;
}

// 중복 제거를 위한 키 생성 함수
const getNameKey = (name: NameResult) => `${name.korean}-${name.roman}`;

const getDisplayName = (lang: LangCode, korean: string, roman: string) =>
  lang === "en" ? roman : `${korean} / ${roman}`;

const getDisplayNickname = (
  lang: LangCode,
  nicknameKorean?: string,
  nicknameRoman?: string
) => {
  if (lang === "en") {
    return nicknameRoman ?? "";
  }
  return [nicknameKorean, nicknameRoman].filter(Boolean).join(" / ");
};

export default function NameGenerator({ onCopy, lang }: NameGeneratorProps) {
  const currentLang = lang;
  const [formData, setFormData] = useState<GenerateNamesRequest>({
    culture: "france",
    gender: "female",
    class: "noble",
    era: "romantic",
    includeNickname: true,
  });
  const [names, setNames] = useState<NameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNames([]);
    setError(null);
  }, [lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackGtagEvent("click_generate_name", "generate_button", "generate_10_names");
    setLoading(true);
    setError(null);

    try {
      const requestBody = { ...formData, lang };
      const response = await fetch("/api/generate-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(getUIText("errorGenerateNames", currentLang));
      }

      const data = await response.json();
      setNames(data.names || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : getUIText("errorGenerateNames", currentLang));
    } finally {
      setLoading(false);
    }
  };

  const copyName = (name: NameResult) => {
    const displayName = getDisplayName(currentLang, name.korean, name.roman);
    navigator.clipboard.writeText(displayName);
    onCopy(getUIText("copySuccessMessage", currentLang));
  };

  const copyFull = (name: NameResult) => {
    const displayName = getDisplayName(currentLang, name.korean, name.roman);
    const nicknameLabel = getDisplayNickname(
      currentLang,
      name.nicknameKorean,
      name.nicknameRoman
    );
    const nicknameText = nicknameLabel 
      ? `\n${getUIText("nicknameLabel", currentLang)} ${nicknameLabel}` 
      : "";
    const classLabel = getDisplayClassLabel(currentLang, formData.class);
    const text = `${displayName} · ${classLabel}${nicknameText}\n${getUIText("descriptionLabel", currentLang)} ${name.desc}`;
    navigator.clipboard.writeText(text);
    onCopy(getUIText("copySuccessMessage", currentLang));
  };

  return (
    <div className="space-y-8">
      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {getUIText("cultureLabel", currentLang)}
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
                  {opt.label[currentLang] ?? opt.label.ko}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {getUIText("genderLabel", currentLang)}
            </label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value as Gender })
              }
              className="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label[currentLang] ?? opt.label.ko}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {getUIText("classLabel", currentLang)}
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
                  {opt.label[currentLang] ?? opt.label.ko}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {getUIText("eraLabel", currentLang)}
            </label>
            <select
              value={formData.era}
              onChange={(e) => setFormData({ ...formData, era: e.target.value as Era })}
              className="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {ERA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label[currentLang] ?? opt.label.ko}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeNickname"
            checked={formData.includeNickname}
            onChange={(e) => setFormData({ ...formData, includeNickname: e.target.checked })}
            className="w-4 h-4 text-[var(--accent)] border-[var(--card-border)] rounded focus:ring-[var(--accent)]"
          />
          <label htmlFor="includeNickname" className="text-sm text-foreground">
            {getUIText("includeNicknameLabel", currentLang)}
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? getUIText("generatingText", currentLang) : getUIText("generateNamesButton", currentLang)}
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
      {!loading && names.length > 0 && (
        <div className="space-y-4">
          {names.map((name, index) => {
            const displayName = getDisplayName(currentLang, name.korean, name.roman);
            const displayNickname = getDisplayNickname(
              currentLang,
              name.nicknameKorean,
              name.nicknameRoman
            );

            return (
              <div
                key={`${getNameKey(name)}-${index}`}
                className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="font-serif text-lg font-semibold text-foreground">
                        {displayName}
                      </span>
                      <span className="ml-2 text-xs text-[var(--accent)]">
                        · {getDisplayClassLabel(currentLang, formData.class)}
                      </span>
                    </div>

                    {displayNickname && (
                      <div className="text-sm text-foreground">
                        <span className="font-medium">{getUIText("nicknameLabel", currentLang)}</span> {displayNickname}
                      </div>
                    )}

                    <div className="text-sm text-[var(--text-muted)] leading-relaxed">
                      {name.desc}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyName(name)}
                      className="px-4 py-2 text-sm border border-[var(--card-border)] rounded-lg hover:bg-[var(--accent-light)]/20 transition-colors whitespace-nowrap"
                    >
                      {getUIText("copyNameButton", currentLang)}
                    </button>
                    <button
                      onClick={() => copyFull(name)}
                      className="px-4 py-2 text-sm border border-[var(--card-border)] rounded-lg hover:bg-[var(--accent-light)]/20 transition-colors whitespace-nowrap"
                    >
                      {getUIText("copyFullButton", currentLang)}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

