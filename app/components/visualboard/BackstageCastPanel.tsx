"use client";

import type { LangCode, CharacterSlot } from "@/app/types";
import { getUIText } from "@/app/i18n/uiText";

type Gender = "male" | "female" | "unknown";

type BackstageCastEntry = {
  name: string;
  gender: Gender;
  onStage: boolean;
};

type BackstageCastState = Array<{
  name: string;
  gender: Gender;
}>;

type BackstageCastPanelProps = {
  storyCharacters: Array<{
    name: string;
    slot: CharacterSlot;
  }>;
  cast: BackstageCastState;
  onCastChange: (next: BackstageCastState) => void;
  lang: LangCode;
};

// 캐릭터 한 줄 컴포넌트
function CastRow({
  entry,
  onGenderChange,
  lang,
}: {
  entry: BackstageCastEntry;
  onGenderChange: (name: string, gender: Gender) => void;
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
      <div className="text-2xl flex-shrink-0" role="img" aria-label={entry.name}>
        {iconEmoji}
      </div>

      {/* 이름 */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">{entry.name}</div>
      </div>

      {/* 성별 선택 UI */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onGenderChange(entry.name, "male")}
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
          onClick={() => onGenderChange(entry.name, "female")}
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
          onClick={() => onGenderChange(entry.name, "unknown")}
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
    </div>
  );
}

export default function BackstageCastPanel({
  storyCharacters,
  cast,
  onCastChange,
  lang,
}: BackstageCastPanelProps) {
  const handleGenderSelect = (name: string, gender: Gender) => {
    const next = cast.map((entry) =>
      entry.name === name ? { ...entry, gender } : entry
    );
    onCastChange(next);
  };

  // 현재 무대에 서 있는 캐릭터 이름 목록
  const onStageNames = new Set(storyCharacters?.map((c) => c.name) || []);

  // cast에 onStage 플래그 추가하고 필터링
  const castWithOnStage: BackstageCastEntry[] = cast.map((entry) => ({
    ...entry,
    onStage: onStageNames.has(entry.name),
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
                key={entry.name}
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
                key={entry.name}
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

