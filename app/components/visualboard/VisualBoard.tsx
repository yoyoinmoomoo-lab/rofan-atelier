"use client";

import { useEffect, useState } from "react";
import type { StoryState, LangCode } from "@/app/types";
import { getUIText } from "@/app/i18n/uiText";
import CharacterSprite from "./CharacterSprite";
// v0: RelationPanel 제거 (관계 기능 비활성화)

interface VisualBoardProps {
  state: StoryState;
  lang: LangCode;
}

// 장면 타입에 따른 배경 그라데이션 매핑 (v0.2: 비주얼 개선)
const SCENE_STYLE_MAP: Record<string, string> = {
  castle: "from-stone-100 to-stone-200",
  room: "from-amber-100 to-amber-200",
  garden: "from-emerald-100 to-emerald-200",
  hall: "from-yellow-100 to-yellow-200",
  carriage: "from-slate-100 to-slate-200",
  forest: "from-emerald-100 to-emerald-200",
  // 한글 타입명도 지원 (API 응답에 따라)
  성: "from-stone-100 to-stone-200",
  방: "from-amber-100 to-amber-200",
  정원: "from-emerald-100 to-emerald-200",
  연회장: "from-yellow-100 to-yellow-200",
  마차: "from-slate-100 to-slate-200",
  숲: "from-emerald-100 to-emerald-200",
};

function getSceneGradient(scene: StoryState["scene"] | null): string {
  if (!scene) return "from-slate-50 to-slate-100";
  
  // visualKey가 있으면 우선 사용, 없으면 type 사용
  const key = (scene.visualKey || scene.type)?.trim() || "";
  return SCENE_STYLE_MAP[key] ?? "from-slate-50 to-slate-100";
}

// 장면 타입 한글/영어 라벨
const sceneTypeLabels: Record<
  StoryState["scene"]["type"],
  { ko: string; en: string }
> = {
  castle: { ko: "성", en: "Castle" },
  room: { ko: "방", en: "Room" },
  garden: { ko: "정원", en: "Garden" },
  hall: { ko: "연회장", en: "Hall" },
  carriage: { ko: "마차", en: "Carriage" },
  forest: { ko: "숲", en: "Forest" },
};

// 대화 강도 라벨
const dialogueImpactLabels: Record<
  StoryState["dialogue_impact"],
  { ko: string; en: string }
> = {
  low: { ko: "낮음", en: "Low" },
  medium: { ko: "보통", en: "Medium" },
  high: { ko: "높음", en: "High" },
};

export default function VisualBoard({ state, lang }: VisualBoardProps) {
  const sceneGradient = getSceneGradient(state.scene);
  const sceneLabel = sceneTypeLabels[state.scene.type][lang];
  const [isHighlighting, setIsHighlighting] = useState(false);

  // StoryState 변경 시 하이라이트 효과
  useEffect(() => {
    setIsHighlighting(true);
    const timer = setTimeout(() => {
      setIsHighlighting(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [state.scene.summary, state.scene.type, state.characters.length]);

  return (
    <div className="w-full space-y-6">
      {/* 장면 정보 카드 - v0.2: 비주얼 개선 */}
      <div
        className={`rounded-3xl p-6 bg-gradient-to-br ${sceneGradient} border border-[var(--card-border)] transition-colors duration-300 ${
          isHighlighting ? "ring-2 ring-amber-400" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              {getUIText("visualboardSceneLabel", lang)}
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/80 backdrop-blur-sm text-slate-900 rounded-full text-sm font-medium shadow-sm">
                {sceneLabel}
              </span>
            </div>
          </div>
        </div>
        {/* location_name 표시 (있는 경우) */}
        {state.scene.location_name && (
          <p className="text-xs text-slate-600 mb-2 font-medium">
            {state.scene.location_name}
          </p>
        )}
        <p className="text-slate-700 text-sm leading-relaxed">
          {state.scene.summary}
        </p>
      </div>

      {/* 캐릭터 배치 영역 */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {getUIText("visualboardCharactersLabel", lang)}
        </h3>

        {state.characters.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            {getUIText("visualboardNoCharacters", lang)}
          </div>
        ) : (
          <div
            className={`
              relative
              min-h-[200px]
              bg-gradient-to-br ${sceneGradient}
              rounded-3xl
              p-8
              flex flex-wrap items-end gap-3
            `}
          >
            {/* 캐릭터 카드 리스트 - flex-wrap으로 2열 정렬 */}
            {state.characters.map((character, index) => (
              <div
                key={`${character.name}-${index}`}
                className="flex-[0_1_120px] max-w-[45%]"
              >
                <CharacterSprite
                  name={character.name}
                  slot={character.slot}
                  mood={character.mood}
                  moodState={character.moodState}
                  lang={lang}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* v0: 관계 패널 제거 (배경과 캐릭터 배치에만 집중) */}
    </div>
  );
}


