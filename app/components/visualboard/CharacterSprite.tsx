"use client";

import type { CharacterSlot, CharacterMoodState, LangCode } from "@/app/types";

interface CharacterSpriteProps {
  name: string;
  slot: CharacterSlot;
  moodState?: CharacterMoodState;
  lang: LangCode;
}

// 감정에 따른 테두리 색상 매핑 (moodState.label 기반)
const MOOD_COLOR_MAP: Record<string, string> = {
  // moodState.label 값들
  neutral: "ring-slate-300",
  joy: "ring-emerald-400",
  anger: "ring-red-400",
  sadness: "ring-sky-400",
  fear: "ring-amber-400",
  surprise: "ring-purple-400",
  tension: "ring-amber-400",
  love: "ring-pink-400",
  contempt: "ring-red-400",
};

// 슬롯 위치에 따른 flex 정렬
const slotPositions: Record<CharacterSlot, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

export default function CharacterSprite({
  name,
  slot,
  moodState,
  lang,
}: CharacterSpriteProps) {
  // moodState.label을 기반으로 ring 색상 결정
  const moodLabel = moodState?.label?.toLowerCase() ?? "";
  const ringClass = MOOD_COLOR_MAP[moodLabel] ?? "ring-slate-300";
  const initial = name?.[0]?.toUpperCase() ?? "?";

  // moodState의 description 또는 label을 표시할 텍스트 결정
  const moodDisplayText = moodState?.description 
    ? moodState.description 
    : moodState?.label 
    ? moodState.label 
    : null;

  return (
    <div className={`flex ${slotPositions[slot]} w-full`}>
      <div className="flex flex-col items-center justify-between rounded-3xl bg-white shadow-sm px-4 py-5 min-w-[120px] transition-all duration-200 hover:scale-105">
        {/* 아바타 영역 */}
        <div
          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ring-2 ${ringClass} bg-slate-50 text-sm font-semibold text-slate-700`}
        >
          {initial}
        </div>
        
        {/* 캐릭터 이름 */}
        <div className="text-sm font-medium text-slate-900 text-center break-words">
          {name}
        </div>
        
        {/* 감정 표시 (moodState.description 또는 label) */}
        {moodDisplayText && (
          <div className="mt-1 text-xs text-slate-500 text-center line-clamp-2 max-w-full">
            {moodDisplayText}
          </div>
        )}
      </div>
    </div>
  );
}


