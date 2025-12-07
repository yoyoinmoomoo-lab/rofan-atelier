"use client";

import type { CharacterSlot, CharacterMood, CharacterMoodState, LangCode } from "@/app/types";

interface CharacterSpriteProps {
  name: string;
  slot: CharacterSlot;
  mood?: CharacterMood;
  moodState?: CharacterMoodState;
  lang: LangCode;
}

// 감정에 따른 테두리 색상 매핑 (v0.2: 비주얼 개선)
const MOOD_COLOR_MAP: Record<string, string> = {
  // 기존 타입
  neutral: "ring-slate-300",
  happy: "ring-emerald-400",
  angry: "ring-red-400",
  sad: "ring-sky-400",
  shy: "ring-pink-400",
  surprised: "ring-purple-400",
  // 한글 감정명도 지원 (API 응답에 따라)
  평온: "ring-emerald-400",
  긴장: "ring-amber-400",
  분노: "ring-red-400",
  슬픔: "ring-sky-400",
  부끄러움: "ring-pink-400",
  놀람: "ring-purple-400",
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
  mood,
  moodState,
  lang,
}: CharacterSpriteProps) {
  const moodKey = mood?.trim() ?? "";
  const ringClass = MOOD_COLOR_MAP[moodKey] ?? "ring-slate-300";
  const initial = name?.[0]?.toUpperCase() ?? "?";

  // moodState의 description 또는 label을 표시할 텍스트 결정
  const moodDisplayText = moodState?.description 
    ? moodState.description 
    : moodState?.label 
    ? moodState.label 
    : mood && mood !== "neutral" 
    ? mood 
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


