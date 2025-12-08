"use client";

import type { StoryState, LangCode } from "@/app/types";

type PixelStageProps = {
  state: StoryState;
  lang: LangCode;
};

// 이모지 결정 유틸 함수 (나중에 도트 스프라이트로 교체하기 쉽도록)
function getCharacterEmoji(index: number): string {
  // 임시: 인덱스 짝수 → 남, 홀수 → 여
  return index % 2 === 0 ? "🧍‍♂️" : "🧍‍♀️";
}

// 감정을 기반으로 이모지 결정
// 우선순위: moodState.label → mood → description 키워드 검색
function getMoodEmoji(character: StoryState["characters"][0]): string {
  // 1순위: moodState.label
  const label = character.moodState?.label?.toLowerCase();
  // 2순위: mood
  const mood = character.mood?.toLowerCase();
  // 3순위: description (키워드 검색용)
  const description = character.moodState?.description?.toLowerCase() || "";
  
  // 우선순위에 따라 source 결정
  const source = label || mood;
  
  // source가 있으면 source 기반으로 매핑
  if (source) {
    if (source.includes("anger") || source.includes("rage")) return "😡";
    if (source.includes("sad") || source.includes("grief")) return "😢";
    if (source.includes("fear") || source.includes("terror")) return "😱";
    if (source.includes("anxiety") || source.includes("nervous") || source.includes("tense")) return "😰";
    if (
      source.includes("joy") ||
      source.includes("happy") ||
      source.includes("happiness") ||
      source.includes("excitement") ||
      source.includes("love")
    )
      return "😊";
    if (source.includes("neutral") || source.includes("calm")) return "😐";
  }
  
  // source가 없거나 매핑되지 않았으면 description 키워드 검색
  if (description) {
    // 분노/화/격노
    if (description.includes("분노") || description.includes("화") || description.includes("격노") || description.includes("angry") || description.includes("rage")) {
      return "😡";
    }
    // 슬픔/울/눈물
    if (description.includes("슬픔") || description.includes("울") || description.includes("눈물") || description.includes("sad") || description.includes("grief")) {
      return "😢";
    }
    // 두려움/겁/공포
    if (description.includes("두려움") || description.includes("겁") || description.includes("공포") || description.includes("fear") || description.includes("terror")) {
      return "😱";
    }
    // 긴장/불안
    if (description.includes("긴장") || description.includes("불안") || description.includes("tension") || description.includes("anxious") || description.includes("anxiety")) {
      return "😰";
    }
    // 행복/기쁨/설렘
    if (description.includes("행복") || description.includes("기쁨") || description.includes("설렘") || description.includes("happy") || description.includes("joy") || description.includes("excited")) {
      return "😊";
    }
    // 무표정/담담/냉정
    if (description.includes("무표정") || description.includes("담담") || description.includes("냉정") || description.includes("neutral") || description.includes("calm")) {
      return "😐";
    }
  }
  
  // 기본값
  return "🙂";
}

// 장면 타입에 따른 배경 색상 매핑
function getSceneBackgroundColor(sceneType: string): string {
  const type = sceneType?.toLowerCase() || "";
  
  if (type === "ball" || type === "hall" || type === "연회장") {
    return "bg-gradient-to-br from-yellow-100 to-yellow-200";
  }
  if (type === "room" || type === "방") {
    return "bg-gradient-to-br from-amber-50 to-amber-100";
  }
  if (type === "garden" || type === "정원" || type === "forest" || type === "숲") {
    return "bg-gradient-to-br from-green-50 to-green-100";
  }
  // 기본 중립 톤
  return "bg-gradient-to-br from-slate-50 to-slate-100";
}

export default function PixelStage({ state, lang }: PixelStageProps) {
  const scene = state.scene;
  const characters = state.characters || [];
  const backgroundClass = getSceneBackgroundColor(scene?.type || "");

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm p-4 mb-4">
      {/* Stage 영역 */}
      <div
        className={`relative w-full overflow-hidden rounded-xl ${backgroundClass} aspect-[3/1] min-h-[120px]`}
      >
        {/* 배경 레이어: 장소 이름 뱃지 */}
        {scene?.location_name && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2 py-1 bg-white/80 backdrop-blur-sm text-slate-700 rounded-full text-xs font-medium shadow-sm">
              {scene.location_name}
            </span>
          </div>
        )}

        {/* 캐릭터 레이어: 가로로 균등 분배 */}
        {characters.length > 0 ? (
          <div className="absolute inset-0 flex items-end justify-center gap-4 px-4 pb-4">
            {characters.map((character, index) => {
              const moodEmoji = getMoodEmoji(character);
              const genderEmoji = getCharacterEmoji(index);
              
              return (
                <div
                  key={`${character.name}-${index}`}
                  className="flex flex-col items-center justify-end h-full flex-1 max-w-[120px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    {/* 감정 말풍선 배지 (위쪽) */}
                    {moodEmoji && (
                      <div className="px-2 py-1 rounded-full bg-white shadow-sm text-base leading-none mb-1 border border-[var(--card-border)]/40">
                        <span role="img" aria-label="mood">
                          {moodEmoji}
                        </span>
                      </div>
                    )}
                    
                    {/* 캐릭터 아이콘 (아래쪽) */}
                    <span className="text-4xl" role="img" aria-label={character.name}>
                      {genderEmoji}
                    </span>
                    
                    {/* 이름 텍스트 */}
                    <div className="mt-2 text-xs text-slate-700 font-medium truncate w-full text-center">
                      {character.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-slate-400 text-sm">No characters</span>
          </div>
        )}
      </div>
    </div>
  );
}

