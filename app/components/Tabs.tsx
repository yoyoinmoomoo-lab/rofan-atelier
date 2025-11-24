"use client";

interface TabsProps {
  activeTab: "names" | "families";
  onTabChange: (tab: "names" | "families") => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-2 mb-8 border-b border-[var(--card-border)]/30">
      <button
        onClick={() => onTabChange("names")}
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
        onClick={() => onTabChange("families")}
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

