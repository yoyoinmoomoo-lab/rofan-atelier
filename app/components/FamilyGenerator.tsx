"use client";

import { useState } from "react";
import { GenerateFamiliesRequest, FamilyResult } from "../types";
import { CULTURE_OPTIONS, CLASS_OPTIONS, ERA_OPTIONS } from "../constants";
import LoadingSpinner from "./LoadingSpinner";

interface FamilyGeneratorProps {
  onCopy: (message: string) => void;
}

// 중복 제거를 위한 키 생성 함수
const getFamilyKey = (family: FamilyResult) => `${family.korean}-${family.roman}`;

export default function FamilyGenerator({ onCopy }: FamilyGeneratorProps) {
  const [formData, setFormData] = useState<GenerateFamiliesRequest>({
    culture: "france",
    class: "noble",
    era: "romantic",
  });
  const [families, setFamilies] = useState<FamilyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("가문명 생성에 실패했습니다.");
      }

      const data = await response.json();
      setFamilies(data.families || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "가문명 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const copyFamily = (family: FamilyResult) => {
    navigator.clipboard.writeText(family.korean);
    onCopy("복사되었습니다 ✧");
  };

  const copyFull = (family: FamilyResult) => {
    const text = `${family.korean} / ${family.roman} · ${family.tone}\n키워드: ${family.keywords.join(", ")}\n설명: ${family.desc}`;
    navigator.clipboard.writeText(text);
    onCopy("복사되었습니다 ✧");
  };

  return (
    <div className="space-y-8">
      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              문화권
            </label>
            <select
              value={formData.culture}
              onChange={(e) => setFormData({ ...formData, culture: e.target.value as any })}
              className="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {CULTURE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              계급
            </label>
            <select
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value as any })}
              className="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {CLASS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              시대감
            </label>
            <select
              value={formData.era}
              onChange={(e) => setFormData({ ...formData, era: e.target.value as any })}
              className="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {ERA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
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
          {loading ? "생성 중..." : "가문명 10개 생성하기"}
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
                      {family.korean}
                    </span>
                    {" / "}
                    <span className="text-sm text-[var(--text-muted)]">
                      {family.roman}
                    </span>
                    <span className="ml-2 text-xs text-[var(--accent)]">
                      · {family.tone}
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
                    가문명 복사
                  </button>
                  <button
                    onClick={() => copyFull(family)}
                    className="px-4 py-2 text-sm border border-[var(--card-border)] rounded-lg hover:bg-[var(--accent-light)]/20 transition-colors whitespace-nowrap"
                  >
                    전체 복사
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

