"use client";

import type { StoryState, LangCode, CharacterMoodState } from "@/app/types";
import type { Gender } from "./VisualBoard";

type StageCharacter = {
  name: string;
  slot?: "left" | "center" | "right";
  moodState?: CharacterMoodState;
  visualKey?: string;
  refId?: string;
  isNew?: boolean;
  gender: Gender;
};

type PixelStageProps = {
  state: StoryState;
  lang: LangCode;
  characters: StageCharacter[];
};

// 성별에 따른 캐릭터 이모지 결정
function getCharacterEmoji(gender: Gender): string {
  switch (gender) {
    case "male":
      return "🧍‍♂️";
    case "female":
      return "🧍‍♀️";
    case "unknown":
    default:
      return "❔";
  }
}

// 감정을 기반으로 이모지 결정
// 1순위: moodState.label (모델이 정해준 라벨)
// 2순위: description 키워드 검색 (한/영 혼합)
function getMoodEmoji(character: { moodState?: CharacterMoodState }): string {
  const label = character.moodState?.label?.toLowerCase();
  const description = character.moodState?.description?.toLowerCase() || "";

  // --- 1단계: label 기준 매핑 --- //
  if (label) {
    switch (label) {
      case "joy":
        // 기쁨 / 행복
        return "😊";
      case "tension":
        // 긴장 / 불안
        return "😰";
      case "anger":
        // 분노
        return "😡";
      case "sadness":
        // 슬픔
        return "😢";
      case "fear":
        // 두려움 / 공포
        return "😱";
      case "surprise":
        // 놀람
        return "😲";
      case "neutral":
        // 차분 / 무표정
        return "😐";
      case "love":
        // 사랑 / 설렘
        return "😍";
      case "contempt":
        // 경멸 / 냉소
        return "😒";
      default:
        break; // 아래 description fallback으로
    }
  }

  // --- 2단계: description 키워드 기반 fallback --- //
  if (description) {
    // 분노 / 짜증 / 질투
    if (
      description.includes("분노") ||
      description.includes("화") ||
      description.includes("격노") ||
      description.includes("질투") ||
      description.includes("시기") ||
      description.includes("angry") ||
      description.includes("rage")
    ) {
      return "😡";
    }

    // 슬픔 / 울음 / 눈물
    if (
      description.includes("슬픔") ||
      description.includes("슬프") ||
      description.includes("울") ||
      description.includes("눈물") ||
      description.includes("sad") ||
      description.includes("grief")
    ) {
      return "😢";
    }

    // 두려움 / 공포 / 겁
    if (
      description.includes("두려움") ||
      description.includes("두려워") ||
      description.includes("겁") ||
      description.includes("공포") ||
      description.includes("fear") ||
      description.includes("terror")
    ) {
      return "😱";
    }

    // 긴장 / 불안 / 초조
    if (
      description.includes("긴장") ||
      description.includes("불안") ||
      description.includes("초조") ||
      description.includes("tension") ||
      description.includes("anxious") ||
      description.includes("anxiety") ||
      description.includes("nervous")
    ) {
      return "😰";
    }

    // 사랑 / 설렘 / 호감
    if (
      description.includes("사랑") ||
      description.includes("좋아한") ||
      description.includes("호감") ||
      description.includes("설렘") ||
      description.includes("두근") ||
      description.includes("두근거") ||
      description.includes("love") ||
      description.includes("affection")
    ) {
      return "😍";
    }

    // 행복 / 기쁨 / 즐거움
    if (
      description.includes("행복") ||
      description.includes("기쁨") ||
      description.includes("기뻐") ||
      description.includes("즐거움") ||
      description.includes("즐겁") ||
      description.includes("happy") ||
      description.includes("joy") ||
      description.includes("excited")
    ) {
      return "😊";
    }

    // 경멸 / 비웃음 / 냉소
    if (
      description.includes("경멸") ||
      description.includes("비웃") ||
      description.includes("냉소") ||
      description.includes("멸시") ||
      description.includes("contempt") ||
      description.includes("sneer")
    ) {
      return "😒";
    }

    // 무표정 / 담담 / 차분
    if (
      description.includes("무표정") ||
      description.includes("담담") ||
      description.includes("차분") ||
      description.includes("침착") ||
      description.includes("neutral") ||
      description.includes("calm")
    ) {
      return "😐";
    }
  }

  // --- 기본값 (애매할 때) --- //
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

export default function PixelStage({ state, lang, characters }: PixelStageProps) {
  const scene = state.scene;
  const backgroundClass = getSceneBackgroundColor(scene?.type || "");

  // 디버깅: 데이터 확인
  console.log("[PixelStage] Rendering:", {
    hasScene: !!scene,
    sceneType: scene?.type,
    charactersCount: characters.length,
    characters: characters.map(c => c.name),
  });

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm p-3 mb-2.5">
      {/* Stage 영역 */}
      <div
        className={`relative w-full overflow-hidden rounded-xl ${backgroundClass} aspect-[3/1] min-h-[120px]`}
      >
        {/* 캐릭터 레이어: 가로로 균등 분배 */}
        {characters.length > 0 ? (
          <div className="absolute inset-0 flex items-end justify-center gap-4 px-4 pb-4">
            {characters.map((character, index) => {
              const moodEmoji = getMoodEmoji(character);
              const genderEmoji = getCharacterEmoji(character.gender);
              
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

