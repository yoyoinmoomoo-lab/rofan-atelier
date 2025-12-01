 "use client";

import { trackGtagEvent } from "../../lib/gtag";
import type { LangCode } from "../types";
import { getUIText } from "../i18n/uiText";

type TabType = "name" | "family" | "character";

interface TabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  lang: LangCode;
}

export default function Tabs({ activeTab, onTabChange, lang }: TabsProps) {
  const handleNameTabClick = () => {
    trackGtagEvent("click_tab_name", "tab", "tab_name_generator");
    onTabChange("name");
  };

  const handleFamilyTabClick = () => {
    trackGtagEvent("click_tab_family", "tab", "tab_family_generator");
    onTabChange("family");
  };

  const handleCharacterTabClick = () => {
    trackGtagEvent("click_tab_character", "tab", "tab_character_generator");
    onTabChange("character");
  };

  return (
    <div className="flex gap-2 mb-8 border-b border-[var(--card-border)]/30">
      <button
        onClick={handleNameTabClick}
        className={`px-6 py-3 font-medium text-sm transition-colors relative ${
          activeTab === "name"
            ? "text-foreground"
            : "text-[var(--text-muted)] hover:text-foreground"
        }`}
      >
        {getUIText("namesTabLabel", lang)}
        {activeTab === "name" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"></span>
        )}
      </button>
      <button
        onClick={handleFamilyTabClick}
        className={`px-6 py-3 font-medium text-sm transition-colors relative ${
          activeTab === "family"
            ? "text-foreground"
            : "text-[var(--text-muted)] hover:text-foreground"
        }`}
      >
        {getUIText("familiesTabLabel", lang)}
        {activeTab === "family" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"></span>
        )}
      </button>
      <button
        onClick={handleCharacterTabClick}
        className={`px-6 py-3 font-medium text-sm transition-colors relative ${
          activeTab === "character"
            ? "text-foreground"
            : "text-[var(--text-muted)] hover:text-foreground"
        }`}
      >
        {getUIText("characterTabLabel", lang)}
        {activeTab === "character" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"></span>
        )}
      </button>
    </div>
  );
}

