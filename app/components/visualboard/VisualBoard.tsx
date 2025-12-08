"use client";

import type { StoryState, LangCode } from "@/app/types";
import { getUIText } from "@/app/i18n/uiText";
import PixelStage from "./PixelStage";
import CharacterStatusPanel from "./CharacterStatusPanel";
import BackstageCastPanel from "./BackstageCastPanel";

interface VisualBoardProps {
  state: StoryState;
  lang: LangCode;
}

export default function VisualBoard({ state, lang }: VisualBoardProps) {
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
      <PixelStage state={state} lang={lang} />

      {/* 2) 하단 텍스트 패널: 장면 + 캐릭터 상태 */}
      <CharacterStatusPanel state={state} lang={lang} />

      {/* 3) 백스테이지 캐스트 패널 */}
      <BackstageCastPanel state={state} lang={lang} />
    </div>
  );
}


