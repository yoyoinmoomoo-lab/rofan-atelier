"use client";

import { useState, useEffect } from "react";
import type { StoryState, LangCode } from "@/app/types";
import { getUIText } from "@/app/i18n/uiText";

type Gender = "male" | "female" | "unknown";

type CharacterCastEntry = {
  name: string;
  gender: Gender;
  iconEmoji: string;
};

type BackstageCastPanelProps = {
  state: StoryState | null;
  lang: LangCode;
};

export default function BackstageCastPanel({
  state,
  lang,
}: BackstageCastPanelProps) {
  const [cast, setCast] = useState<Map<string, CharacterCastEntry>>(new Map());

  // StoryState.characters가 업데이트될 때마다 cast 업데이트
  useEffect(() => {
    if (!state?.characters) return;

    setCast((prevCast) => {
      const newCast = new Map(prevCast);
      
      state.characters.forEach((character) => {
        if (!newCast.has(character.name)) {
          // 새로운 캐릭터 추가
          newCast.set(character.name, {
            name: character.name,
            gender: "unknown",
            iconEmoji: "❔",
          });
        }
      });
      
      return newCast;
    });
  }, [state?.characters]);

  const handleGenderChange = (name: string, gender: Gender) => {
    setCast((prevCast) => {
      const newCast = new Map(prevCast);
      const entry = newCast.get(name);
      
      if (entry) {
        let iconEmoji = "❔";
        if (gender === "male") {
          iconEmoji = "🧍‍♂️";
        } else if (gender === "female") {
          iconEmoji = "🧍‍♀️";
        }
        
        newCast.set(name, {
          ...entry,
          gender,
          iconEmoji,
        });
      }
      
      return newCast;
    });
  };

  // 현재 무대에 서 있는 캐릭터 이름 목록
  const onStageNames = new Set(
    state?.characters?.map((c) => c.name) || []
  );

  const castArray = Array.from(cast.values());

  if (castArray.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        {getUIText("visualboardBackstageCastTitle", lang)}
      </h3>
      
      <div className="space-y-3">
        {castArray.map((entry) => {
          const isOnStage = onStageNames.has(entry.name);
          
          return (
            <div
              key={entry.name}
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--card-border)] bg-white/50"
            >
              {/* 아이콘 */}
              <div className="text-2xl flex-shrink-0" role="img" aria-label={entry.name}>
                {entry.iconEmoji}
              </div>
              
              {/* 이름 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {entry.name}
                </div>
              </div>
              
              {/* 성별 선택 UI */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleGenderChange(entry.name, "male")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    entry.gender === "male"
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  aria-label={`${entry.name} - ${getUIText("castGenderMale", lang)}`}
                >
                  {getUIText("castGenderMale", lang)}
                </button>
                <button
                  onClick={() => handleGenderChange(entry.name, "female")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    entry.gender === "female"
                      ? "bg-pink-100 text-pink-700 font-medium"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  aria-label={`${entry.name} - ${getUIText("castGenderFemale", lang)}`}
                >
                  {getUIText("castGenderFemale", lang)}
                </button>
                <button
                  onClick={() => handleGenderChange(entry.name, "unknown")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    entry.gender === "unknown"
                      ? "bg-slate-200 text-slate-700 font-medium"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  aria-label={`${entry.name} - ${getUIText("castGenderUnknown", lang)}`}
                >
                  {getUIText("castGenderUnknown", lang)}
                </button>
              </div>
              
              {/* 무대 위 배지 */}
              {isOnStage && (
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-xs font-medium">
                    {getUIText("castOnStage", lang)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

