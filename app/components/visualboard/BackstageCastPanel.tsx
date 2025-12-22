"use client";

import type { LangCode, CharacterSlot, BackstageCastEntryV2, CastGender } from "@/app/types";
import { getUIText } from "@/app/i18n/uiText";

type Gender = CastGender;

type BackstageCastEntry = BackstageCastEntryV2 & {
  onStage: boolean;
};

type BackstageCastPanelProps = {
  storyCharacters: Array<{
    name: string;
    slot: CharacterSlot;
  }>;
  cast: BackstageCastEntryV2[];
  onCastChange: (next: BackstageCastEntryV2[]) => void;
  lang: LangCode;
  scenarioKey?: string; // Step4 Hotfix: Extension 동기화용
};

// 캐릭터 한 줄 컴포넌트
function CastRow({
  entry,
  onGenderChange,
  lang,
}: {
  entry: BackstageCastEntry;
  onGenderChange: (id: string, gender: Gender) => void;
  lang: LangCode;
}) {
  const getIconEmoji = (gender: Gender): string => {
    if (gender === "male") return "🧍‍♂️";
    if (gender === "female") return "🧍‍♀️";
    return "❔";
  };

  const iconEmoji = getIconEmoji(entry.gender);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--card-border)] bg-white/50">
      {/* 아이콘 */}
      <div className="text-2xl flex-shrink-0" role="img" aria-label={entry.canonicalName}>
        {iconEmoji}
      </div>

      {/* 이름 */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">{entry.canonicalName}</div>
        {entry.aliases.length > 1 && (
          <div className="text-xs text-[var(--text-muted)] truncate">
            {entry.aliases.slice(1).join(", ")}
          </div>
        )}
      </div>

      {/* 성별 선택 UI */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onGenderChange(entry.id, "male")}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            entry.gender === "male"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          aria-label={`${entry.canonicalName} - ${getUIText("castGenderMale", lang)}`}
        >
          {getUIText("castGenderMale", lang)}
        </button>
        <button
          onClick={() => onGenderChange(entry.id, "female")}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            entry.gender === "female"
              ? "bg-pink-100 text-pink-700 font-medium"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          aria-label={`${entry.canonicalName} - ${getUIText("castGenderFemale", lang)}`}
        >
          {getUIText("castGenderFemale", lang)}
        </button>
        <button
          onClick={() => onGenderChange(entry.id, "unknown")}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            entry.gender === "unknown"
              ? "bg-slate-200 text-slate-700 font-medium"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          aria-label={`${entry.canonicalName} - ${getUIText("castGenderUnknown", lang)}`}
        >
          {getUIText("castGenderUnknown", lang)}
        </button>
      </div>
    </div>
  );
}

export default function BackstageCastPanel({
  storyCharacters,
  cast,
  onCastChange,
  lang,
  scenarioKey,
}: BackstageCastPanelProps) {
  const handleGenderSelect = (id: string, gender: Gender) => {
    const next = cast.map((entry) =>
      entry.id === id ? { ...entry, gender } : entry
    );
    onCastChange(next);
    
    // Step4 Hotfix: Extension으로 캐스트 동기화
    if (scenarioKey && typeof window !== 'undefined' && window.parent) {
      // cast 배열을 CastStoreV2로 변환
      const castStore = {
        version: 'v2' as const,
        charactersById: next.reduce((acc, entry) => {
          acc[entry.id] = entry;
          return acc;
        }, {} as Record<string, BackstageCastEntryV2>),
        aliasMap: {}, // TODO: aliasMap도 동기화 필요할 수 있음 (Phase3)
      };
      
      window.parent.postMessage({
        protocol: 'visualboard-v1',
        sender: 'test-board',
        type: 'CAST_STORE_UPDATE',
        scenarioKey,
        castStore,
        timestamp: Date.now(),
      }, '*');
    } else {
      // 경고는 유지 (문제 진단용)
      console.warn('[iframe] CAST_STORE_UPDATE skipped:', {
        hasScenarioKey: !!scenarioKey,
        hasWindow: typeof window !== 'undefined',
        hasParent: typeof window !== 'undefined' && !!window.parent,
      });
    }
  };

  // 현재 무대에 서 있는 캐릭터 이름 목록
  const onStageNames = new Set(storyCharacters?.map((c) => c.name) || []);

  // cast에 onStage 플래그 추가하고 필터링
  const castWithOnStage: BackstageCastEntry[] = cast.map((entry) => ({
    ...entry,
    onStage: onStageNames.has(entry.canonicalName) || entry.aliases.some(alias => onStageNames.has(alias)),
  }));

  const onStageCast = castWithOnStage.filter((c) => c.onStage);
  const offStageCast = castWithOnStage.filter((c) => !c.onStage);

  if (cast.length === 0) {
    return null;
  }

  return (
    <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 sm:p-6 space-y-6">
      <h2 className="text-lg font-semibold text-foreground mb-2">
        {getUIText("visualboardCastTitle", lang)}
      </h2>

      {/* 무대 위 섹션 */}
      {onStageCast.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-[var(--text-muted)] mb-1">
            {getUIText("castOnStageSectionTitle", lang)}
          </div>
          <div className="space-y-3">
            {onStageCast.map((entry) => (
              <CastRow
                key={entry.id}
                entry={entry}
                onGenderChange={handleGenderSelect}
                lang={lang}
              />
            ))}
          </div>
        </div>
      )}

      {/* 무대 뒤 섹션 */}
      {offStageCast.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-[var(--text-muted)] mb-1">
            {getUIText("castOffStageSectionTitle", lang)}
          </div>
          <div className="space-y-3">
            {offStageCast.map((entry) => (
              <CastRow
                key={entry.id}
                entry={entry}
                onGenderChange={handleGenderSelect}
                lang={lang}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

