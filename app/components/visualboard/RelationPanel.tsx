"use client";

import type { StoryState, LangCode } from "@/app/types";
import { getUIText } from "@/app/i18n/uiText";

interface RelationPanelProps {
  relations: StoryState["relations"];
  lang: LangCode;
}

export default function RelationPanel({ relations, lang }: RelationPanelProps) {
  if (relations.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 text-center text-text-muted">
        {getUIText("visualboardNoRelations", lang)}
      </div>
    );
  }

  // 값에 따른 색상 결정 (0~100)
  const getTensionColor = (value: number) => {
    if (value >= 70) return "bg-red-500";
    if (value >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getAffectionColor = (value: number) => {
    if (value >= 70) return "bg-pink-500";
    if (value >= 40) return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        {getUIText("visualboardRelationsLabel", lang)}
      </h3>
      
      <div className="space-y-3">
        {relations.map((relation, index) => (
          <div
            key={`${relation.a}-${relation.b}-${index}`}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4"
          >
            {/* 관계 쌍 */}
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium text-foreground">
                <span className="text-[var(--accent)]">{relation.a}</span>
                <span className="mx-2 text-text-muted">↔</span>
                <span className="text-[var(--accent)]">{relation.b}</span>
              </div>
            </div>

            {/* 긴장도 */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-muted">
                  {getUIText("visualboardTensionLabel", lang)}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {relation.tension}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getTensionColor(relation.tension)} transition-all duration-300`}
                  style={{ width: `${relation.tension}%` }}
                />
              </div>
            </div>

            {/* 호감도 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-muted">
                  {getUIText("visualboardAffectionLabel", lang)}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {relation.affection}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getAffectionColor(relation.affection)} transition-all duration-300`}
                  style={{ width: `${relation.affection}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


