 "use client";

import { trackGtagEvent } from "../../lib/gtag";

interface TabsProps {
  activeTab: "names" | "families";
  onTabChange: (tab: "names" | "families") => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const handleNamesTabClick = () => {
    trackGtagEvent("click_tab_name", "tab", "tab_name_generator");
    onTabChange("names");
  };

  const handleFamiliesTabClick = () => {
    trackGtagEvent("click_tab_family", "tab", "tab_family_generator");
    onTabChange("families");
  };
  return (
    <div className="flex gap-2 mb-8 border-b border-[var(--card-border)]/30">
      <button
        onClick={handleNamesTabClick}
        className={`px-6 py-3 font-medium text-sm transition-colors relative ${
          activeTab === "names"
            ? "text-foreground"
            : "text-[var(--text-muted)] hover:text-foreground"
        }`}
      >
        이름 생성
        {activeTab === "names" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"></span>
        )}
      </button>
      <button
        onClick={handleFamiliesTabClick}
        className={`px-6 py-3 font-medium text-sm transition-colors relative ${
          activeTab === "families"
            ? "text-foreground"
            : "text-[var(--text-muted)] hover:text-foreground"
        }`}
      >
        가문명 생성
        {activeTab === "families" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"></span>
        )}
      </button>
    </div>
  );
}

