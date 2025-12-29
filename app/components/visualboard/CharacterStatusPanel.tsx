"use client";

import type { StoryState, LangCode } from "@/app/types";
import { getUIText } from "@/app/i18n/uiText";

type CharacterStatusPanelProps = {
  state: StoryState | null;
  lang: LangCode;
};

export default function CharacterStatusPanel({
  state,
  lang,
}: CharacterStatusPanelProps) {
  if (!state) {
    return null;
  }

  const scene = state.scene;
  const characters = state.characters || [];

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm p-4 space-y-3">
      {/* 캐릭터 상태 섹션만 표시 */}
      {characters.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-base font-semibold text-foreground">
            {getUIText("visualboardCharacterStatusTitle", lang)}
          </h3>
          <div className="space-y-2">
            {characters.map((character, index) => (
              <div
                key={`${character.name}-${index}`}
                className={`${index > 0 ? "border-t border-[var(--card-border)] pt-2" : ""}`}
              >
                <div className="font-semibold text-foreground mb-0.5 text-sm">
                  {character.name}
                </div>
                <div className="text-sm text-[var(--text-muted)] leading-snug whitespace-pre-wrap break-words">
                  {/* moodState.description이 있으면 우선 표시 */}
                  {character.moodState?.description ? (
                    <p>{character.moodState.description}</p>
                  ) : (
                    <>
                      {/* moodState.label이 있으면 표시 */}
                      {character.moodState?.label ? (
                        <p>
                          <span className="font-medium">State: </span>
                          {character.moodState.label}
                        </p>
                      ) : (
                        /* Step3.1: 상태 텍스트가 빈 경우 fallback */
                        <p className="text-xs text-[var(--text-muted)]/60 italic">
                          (상태 요약 없음)
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

