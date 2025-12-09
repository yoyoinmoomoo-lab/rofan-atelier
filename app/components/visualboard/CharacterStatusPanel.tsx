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
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm p-6 space-y-4">
      {/* 상단: 현재 장면 섹션 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          {getUIText("visualboardCurrentSceneTitle", lang)}
        </h3>
        {scene?.location_name && (
          <div className="inline-block">
            <span className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-sm font-medium">
              {scene.location_name}
            </span>
          </div>
        )}
        {scene?.summary && (
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap break-words">
            {scene.summary}
          </p>
        )}
      </div>

      {/* 하단: 캐릭터 상태 섹션 */}
      {characters.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[var(--card-border)]">
          <h3 className="text-lg font-semibold text-foreground">
            {getUIText("visualboardCharacterStatusTitle", lang)}
          </h3>
          <div className="space-y-3">
            {characters.map((character, index) => (
              <div
                key={`${character.name}-${index}`}
                className={`${index > 0 ? "border-t border-[var(--card-border)] pt-3" : ""}`}
              >
                <div className="font-semibold text-foreground mb-1">
                  {character.name}
                </div>
                <div className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap break-words">
                  {/* moodState.description이 있으면 우선 표시 */}
                  {character.moodState?.description ? (
                    <p>{character.moodState.description}</p>
                  ) : (
                    <>
                      {/* moodState.label이 있으면 표시 */}
                      {character.moodState?.label && (
                        <p>
                          <span className="font-medium">State: </span>
                          {character.moodState.label}
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

