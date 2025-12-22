"use client";

import { useState, useEffect, useRef } from "react";
import type { StoryState, StoryStateV2, Scene, LangCode, CastStoreV2, BackstageCastEntryV2, CastGender, CharacterMoodState } from "@/app/types";
import { getUIText } from "@/app/i18n/uiText";
import {
  loadCastStore,
  saveCastStore,
  createEmptyCastStore,
  castStoreToArray,
  arrayToCastStore,
  generateUUID,
  normalizeAlias,
} from "@/app/lib/storage";
import PixelStage from "./PixelStage";
import CharacterStatusPanel from "./CharacterStatusPanel";
import BackstageCastPanel from "./BackstageCastPanel";

export type Gender = CastGender;

type StageCharacter = {
  name: string;
  slot?: "left" | "center" | "right";
  moodState?: CharacterMoodState;
  visualKey?: string;
  refId?: string;
  isNew?: boolean;
  gender: Gender;
};

type CastByScenario = Record<string, CastStoreV2>;

interface VisualBoardProps {
  state: StoryState;
  lang: LangCode;
  scenarioKey?: string;
  onStateRestore?: (restoredState: StoryState) => void;
  disableRestore?: boolean; // Chrome Extension 모드에서는 localStorage 복구 비활성화
}

const STATE_KEY_PREFIX = "rofan-visualboard-state::";

export default function VisualBoard({ 
  state, 
  lang, 
  scenarioKey, 
  onStateRestore,
  disableRestore = false 
}: VisualBoardProps) {
  const [castByScenario, setCastByScenario] = useState<CastByScenario>({});
  const hasLoadedStateRef = useRef<Record<string, boolean>>({});
  const lastSavedStateRef = useRef<Record<string, string>>({});

  const scenarioKeySafe = scenarioKey ?? "__default__";

  // Step3: v1 형식 변환 (scenes[]가 없을 때)
  function normalizeStateToV2(state: StoryState): StoryStateV2 {
    if (state.scenes && Array.isArray(state.scenes) && state.scenes.length > 0) {
      // v2 형식: scenes[]가 있으면 그대로 사용
      return {
        ...state,
        scenes: state.scenes,
        activeSceneIndex: state.activeSceneIndex ?? (state.scenes.length - 1),
      };
    }
    
    // v1 형식: scene + characters → scenes[]로 변환
    if (state.scene && state.characters) {
      return {
        ...state,
        scenes: [{
          summary: state.scene.summary || '',
          type: state.scene.type || 'room',
          location_name: state.scene.location_name,
          backdrop_style: state.scene.backdrop_style,
          characters: state.characters,
          dialogue_impact: state.dialogue_impact || 'medium',
        }],
        activeSceneIndex: 0,
      };
    }
    
    // 변환 불가: 빈 scenes 배열 반환
    return {
      ...state,
      scenes: [],
      activeSceneIndex: 0,
    };
  }

  // 기존 캐스트에 새 캐릭터만 추가하는 merge 함수 (캐릭터 제거하지 않음)
  // Step3: scenes[]에서 모든 캐릭터 수집
  function buildMergedCastFromStory(
    prevCast: CastStoreV2 | undefined,
    state: StoryState
  ): CastStoreV2 {
    // 1) 이전 캐스트를 기준으로 시작
    const castStore = prevCast ?? createEmptyCastStore();

    // 2) Step3: scenes[]에서 모든 캐릭터 수집 (없으면 v1 characters 사용)
    const normalizedState = normalizeStateToV2(state);
    const allCharacters: Array<{ name: string }> = [];
    
    if (normalizedState.scenes && normalizedState.scenes.length > 0) {
      // scenes[]에서 모든 캐릭터 수집
      for (const scene of normalizedState.scenes) {
        for (const ch of scene.characters) {
          allCharacters.push(ch);
        }
      }
    } else if (state.characters) {
      // v1 fallback
      allCharacters.push(...state.characters);
    }

    // 3) 새로 등장한 캐릭터를 추가만 함 (기존 캐릭터는 유지)
    for (const ch of allCharacters) {
      // aliasMap에서 찾기
      const normalizedName = normalizeAlias(ch.name);
      const existingId = castStore.aliasMap[normalizedName];

      if (!existingId) {
        // 새 캐릭터 추가
        const id = generateUUID();
        const newEntry: BackstageCastEntryV2 = {
          id,
          canonicalName: ch.name,
          aliases: [ch.name],
          gender: "unknown",
          isGhost: false,
        };
        castStore.charactersById[id] = newEntry;
        castStore.aliasMap[normalizedName] = id;
      }
    }

    // 4) 기존에 있었지만 이번 턴에 안 나온 캐릭터도 그대로 유지
    return castStore;
  }

  // state 또는 scenarioKeySafe가 바뀔 때 캐스트 상태 초기화 및 localStorage에서 복원
  useEffect(() => {
    if (!state) return;

    setCastByScenario((prev) => {
      const prevCastForScenario = prev[scenarioKeySafe];

      // localStorage에서 불러오기 (최초 로드 시에만)
      let loadedCast: CastStoreV2 | null = null;
      if (!prevCastForScenario && scenarioKey) {
        loadedCast = loadCastStore(scenarioKey);
      }

      // 기존 캐스트 또는 localStorage에서 불러온 캐스트를 기준으로 merge
      const merged = buildMergedCastFromStory(
        prevCastForScenario ?? loadedCast ?? undefined,
        state
      );

      return {
        ...prev,
        [scenarioKeySafe]: merged,
      };
    });
  }, [state, scenarioKey, scenarioKeySafe]);

  // castByScenario가 변경될 때 localStorage에 저장 (scenarioKey가 있을 때만)
  useEffect(() => {
    if (!scenarioKey || !state) return;
    if (typeof window === "undefined") return;

    const current = castByScenario[scenarioKeySafe];
    if (!current) return;

    saveCastStore(scenarioKey, current);
    
    // Step4 Hotfix: Extension으로 캐스트 동기화
    if (window.parent) {
      window.parent.postMessage({
        protocol: 'visualboard-v1',
        sender: 'test-board',
        type: 'CAST_STORE_UPDATE',
        scenarioKey,
        castStore: current,
        timestamp: Date.now(),
      }, '*');
    }
  }, [castByScenario, scenarioKey, scenarioKeySafe, state]);

  // 마운트 시 시나리오별 마지막 무대 상태 복원 (시나리오별 최초 1회만 실행)
  // Chrome Extension 모드에서는 복구 비활성화 (Extension이 보낸 데이터가 진실의 원천)
  useEffect(() => {
    if (disableRestore) return; // Extension 모드에서는 복구하지 않음
    if (!scenarioKey) return;
    if (typeof window === "undefined") return;
    
    const scenarioKeySafe = scenarioKey ?? "__default__";
    if (hasLoadedStateRef.current[scenarioKeySafe]) return; // 이미 로드했으면 스킵

    const key = `${STATE_KEY_PREFIX}${scenarioKey}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      hasLoadedStateRef.current[scenarioKeySafe] = true; // 로드 시도했으므로 플래그 설정
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoryState;
      if (onStateRestore) {
        hasLoadedStateRef.current[scenarioKeySafe] = true; // 복원 전에 플래그 설정
        onStateRestore(parsed);
      }
    } catch (e) {
      console.warn("[Rofan Visualboard] Failed to restore story state", e);
      hasLoadedStateRef.current[scenarioKeySafe] = true; // 에러가 나도 플래그 설정
    }
  }, [scenarioKey, onStateRestore, disableRestore]);

  // state가 바뀔 때 시나리오별 마지막 무대 상태 저장 (이전 값과 다를 때만)
  useEffect(() => {
    if (!scenarioKey || !state) return;
    if (typeof window === "undefined") return;

    const key = `${STATE_KEY_PREFIX}${scenarioKey}`;
    const stateString = JSON.stringify(state);
    const scenarioKeySafe = scenarioKey ?? "__default__";
    
    // 이전 저장된 값과 같으면 저장하지 않음
    if (lastSavedStateRef.current[scenarioKeySafe] === stateString) {
      return;
    }

    try {
      window.localStorage.setItem(key, stateString);
      lastSavedStateRef.current[scenarioKeySafe] = stateString;
    } catch (e) {
      console.warn("[Rofan Visualboard] Failed to save story state", e);
    }
  }, [scenarioKey, state]);

  const currentCastStore = castByScenario[scenarioKeySafe] ?? createEmptyCastStore();
  const currentCastArray = castStoreToArray(currentCastStore);

  const handleCastChange = (next: BackstageCastEntryV2[]) => {
    const nextStore = arrayToCastStore(next);
    setCastByScenario((prev) => ({
      ...prev,
      [scenarioKeySafe]: nextStore,
    }));
  };

  // Step3: state를 v2로 정규화
  const normalizedState = normalizeStateToV2(state);
  const scenes = normalizedState.scenes || [];
  const activeSceneIndex = normalizedState.activeSceneIndex ?? (scenes.length > 0 ? scenes.length - 1 : 0);

  // 모든 scenes에서 캐릭터 수집 (백스테이지 패널용)
  const allStoryCharacters = scenes.flatMap(scene => scene.characters);

  if (!state) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-8 text-center text-text-muted">
        <p>{getUIText("visualboardNoState", lang)}</p>
      </div>
    );
  }

  // Step3: scenes[] 리스트 렌더링
  return (
    <div className="space-y-6">
      {scenes.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-8 text-center text-text-muted">
          <p>{getUIText("visualboardNoState", lang)}</p>
        </div>
      ) : (
        scenes.map((scene, index) => {
          // 각 scene의 캐릭터에 gender 정보 추가
          const sceneCharactersWithGender: StageCharacter[] = scene.characters.map((character) => {
            const normalizedName = normalizeAlias(character.name);
            const characterId = currentCastStore.aliasMap[normalizedName];
            const castItem = characterId ? currentCastStore.charactersById[characterId] : null;
            
            return {
              ...character,
              gender: castItem?.gender ?? "unknown",
            };
          });

          // scene을 StoryState 형태로 변환 (PixelStage 호환성)
          // v1 형식 호환을 위해 타입 단언 사용 (v2의 optional slot을 v1 형식으로 변환)
          const sceneAsState: StoryState = {
            scene: {
              summary: scene.summary,
              type: scene.type,
              location_name: scene.location_name,
              backdrop_style: scene.backdrop_style,
            },
            characters: scene.characters as any, // v1 형식 호환 (slot optional → 필수로 변환)
            relations: [],
            dialogue_impact: scene.dialogue_impact,
          };

          // 디버깅: scene 데이터 확인
          console.log(`[VisualBoard] Scene ${index}:`, {
            sceneType: scene.type,
            locationName: scene.location_name,
            charactersCount: scene.characters.length,
            sceneCharactersWithGenderCount: sceneCharactersWithGender.length,
            sceneAsState: sceneAsState,
          });

          const isActive = index === activeSceneIndex;

          return (
            <div
              key={`scene-${index}`}
              className={`space-y-4 ${isActive ? 'ring-2 ring-[var(--accent)] rounded-lg p-2' : ''}`}
            >
              {/* 장면 헤더 */}
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  장면 {index + 1}{scenes.length > 1 ? ` / ${scenes.length}` : ''}
                  {scene.location_name && `: ${scene.location_name}`}
                </h3>
                {isActive && (
                  <span className="px-2 py-1 text-xs font-medium bg-[var(--accent)] text-white rounded">
                    현재 장면
                  </span>
                )}
              </div>
              {scene.summary && (
                <p className="text-sm text-text-muted">{scene.summary}</p>
              )}

              {/* 1) 상단 무대: 이미지 레이어 */}
              <PixelStage state={sceneAsState} lang={lang} characters={sceneCharactersWithGender} />

              {/* 2) 하단 텍스트 패널: 장면 + 캐릭터 상태 */}
              <CharacterStatusPanel state={sceneAsState} lang={lang} />

              {/* 장면 구분선 (마지막 장면이 아니면) */}
              {index < scenes.length - 1 && (
                <div className="border-t border-[var(--card-border)] my-4" />
              )}
            </div>
          );
        })
      )}

      {/* 3) 백스테이지 캐스트 패널 (모든 scenes의 캐릭터) */}
      <BackstageCastPanel
        storyCharacters={allStoryCharacters}
        cast={currentCastArray}
        onCastChange={handleCastChange}
        lang={lang}
        scenarioKey={scenarioKey}
      />
    </div>
  );
}


