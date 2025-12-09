"use client";

import { useState, useEffect, useRef } from "react";
import type { StoryState, LangCode } from "@/app/types";
import { getUIText } from "@/app/i18n/uiText";
import PixelStage from "./PixelStage";
import CharacterStatusPanel from "./CharacterStatusPanel";
import BackstageCastPanel from "./BackstageCastPanel";

export type Gender = "male" | "female" | "unknown";

type BackstageCastEntry = {
  name: string;
  gender: Gender;
};

type StageCharacter = StoryState["characters"][number] & { gender: Gender };

type BackstageCastState = BackstageCastEntry[];

type CastByScenario = Record<string, BackstageCastState>;

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

  // 기존 캐스트에 새 캐릭터만 추가하는 merge 함수 (캐릭터 제거하지 않음)
  function buildMergedCastFromStory(
    prevCast: BackstageCastState | undefined,
    state: StoryState
  ): BackstageCastState {
    // 1) 이전 캐스트를 기준으로 시작 (Map으로 변환하여 빠른 조회)
    const castMap = new Map<string, BackstageCastEntry>();
    if (prevCast) {
      prevCast.forEach((entry) => {
        castMap.set(entry.name, entry);
      });
    }

    // 2) 새로 등장한 캐릭터를 추가만 함 (기존 캐릭터는 유지)
    for (const ch of state.characters) {
      if (!castMap.has(ch.name)) {
        castMap.set(ch.name, {
          name: ch.name,
          gender: "unknown",
        });
      }
    }

    // 3) 기존에 있었지만 이번 턴에 안 나온 캐릭터도 그대로 유지
    return Array.from(castMap.values());
  }

  // state 또는 scenarioKeySafe가 바뀔 때 캐스트 상태 초기화 및 localStorage에서 복원
  useEffect(() => {
    if (!state) return;

    setCastByScenario((prev) => {
      const prevCastForScenario = prev[scenarioKeySafe];

      // localStorage에서 불러오기 (최초 로드 시에만)
      let loadedCast: BackstageCastState | null = null;
      if (!prevCastForScenario && scenarioKey) {
        const key = `rofan-visualboard-cast::${scenarioKey}`;
        try {
          if (typeof window !== "undefined") {
            const stored = window.localStorage.getItem(key);
            if (stored) {
              loadedCast = JSON.parse(stored) as BackstageCastState;
            }
          }
        } catch (e) {
          console.warn("[Rofan Visualboard] Failed to load cast from localStorage", e);
        }
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

    const key = `rofan-visualboard-cast::${scenarioKey}`;
    const current = castByScenario[scenarioKeySafe];

    if (!current) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(current));
    } catch (e) {
      console.warn("[Rofan Visualboard] Failed to save cast to localStorage", e);
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

  const currentCast = castByScenario[scenarioKeySafe] ?? [];

  const handleCastChange = (next: BackstageCastState) => {
    setCastByScenario((prev) => ({
      ...prev,
      [scenarioKeySafe]: next,
    }));
  };

  // 무대용 캐릭터 리스트 생성 (gender 정보 포함)
  const castMap = new Map<string, BackstageCastEntry>();
  currentCast.forEach((entry) => {
    castMap.set(entry.name, entry);
  });

  const charactersWithGender: StageCharacter[] = state.characters.map((character) => {
    const castItem = castMap.get(character.name);
    return {
      ...character,
      gender: castItem?.gender ?? "unknown",
    };
  });

  if (!state) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-8 text-center text-text-muted">
        <p>{getUIText("visualboardNoState", lang)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1) 상단 무대: 이미지 레이어 */}
      <PixelStage state={state} lang={lang} characters={charactersWithGender} />

      {/* 2) 하단 텍스트 패널: 장면 + 캐릭터 상태 */}
      <CharacterStatusPanel state={state} lang={lang} />

      {/* 3) 백스테이지 캐스트 패널 */}
      <BackstageCastPanel
        storyCharacters={state.characters}
        cast={currentCast}
        onCastChange={handleCastChange}
        lang={lang}
      />
    </div>
  );
}


