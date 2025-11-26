"use client";

import { useState } from "react";
import type {
  GenerateNamesRequest,
  NameResult,
  Culture,
  Gender,
  Class as ClassType,
  Era,
} from "../types";
import { CULTURE_OPTIONS, GENDER_OPTIONS, CLASS_OPTIONS, ERA_OPTIONS } from "../constants";
import LoadingSpinner from "./LoadingSpinner";
import { trackGtagEvent } from "../../lib/gtag";

interface NameGeneratorProps {
  onCopy: (message: string) => void;
}

// 중복 제거를 위한 키 생성 함수
const getNameKey = (name: NameResult) => `${name.korean}-${name.roman}`;

export default function NameGenerator({ onCopy }: NameGeneratorProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackGtagEvent("click_generate_name", "generate_button", "generate_10_names");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("이름 생성에 실패했습니다.");
      }

      const data = await response.json();
      setNames(data.names || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이름 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const copyName = (name: NameResult) => {
    navigator.clipboard.writeText(name.korean);
    onCopy("복사되었습니다 ✧");
  };

  const copyFull = (name: NameResult) => {
    let nicknameText = "";
    if (name.nicknameRoman || name.nicknameKorean) {
      const parts = [];
      if (name.nicknameRoman) parts.push(name.nicknameRoman);
      if (name.nicknameKorean) parts.push(name.nicknameKorean);
      nicknameText = `\n애칭: ${parts.join(" / ")}`;
    }
    const text = `${name.korean} / ${name.roman} · ${name.classTone}${nicknameText}\n설명: ${name.desc}`;
    navigator.clipboard.writeText(text);
    onCopy("복사되었습니다 ✧");
  };

  return (
    <div className="space-y-8">
      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              문화권
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
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              성별
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
              onChange={(e) =>
                setFormData({ ...formData, class: e.target.value as ClassType })
              }
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
              onChange={(e) => setFormData({ ...formData, era: e.target.value as Era })}
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeNickname"
            checked={formData.includeNickname}
            onChange={(e) => setFormData({ ...formData, includeNickname: e.target.checked })}
            className="w-4 h-4 text-[var(--accent)] border-[var(--card-border)] rounded focus:ring-[var(--accent)]"
          />
          <label htmlFor="includeNickname" className="text-sm text-foreground">
            애칭 포함하기
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "생성 중..." : "이름 10개 생성하기"}
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
          {names.map((name, index) => (
            <div
              key={`${getNameKey(name)}-${index}`}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div>
                    <span className="font-serif text-lg font-semibold text-foreground">
                      {name.korean}
                    </span>
                    {" / "}
                    <span className="text-sm text-[var(--text-muted)]">
                      {name.roman}
                    </span>
                    <span className="ml-2 text-xs text-[var(--accent)]">
                      · {name.classTone}
                    </span>
                  </div>

                  {(name.nicknameRoman || name.nicknameKorean) && (
                    <div className="text-sm text-foreground">
                      <span className="font-medium">애칭:</span>{" "}
                      {name.nicknameRoman && name.nicknameKorean
                        ? `${name.nicknameRoman} / ${name.nicknameKorean}`
                        : name.nicknameRoman || name.nicknameKorean}
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
                    이름만 복사
                  </button>
                  <button
                    onClick={() => copyFull(name)}
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

