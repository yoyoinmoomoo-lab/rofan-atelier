"use client";

import type { LangCode } from "../types";

interface ScaleControlProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  labels: {
    [key: number]: { ko: string; en: string };
  };
  lang: LangCode;
  helpText?: string;
}

export default function ScaleControl({
  value,
  onChange,
  min,
  max,
  labels,
  lang,
  helpText,
}: ScaleControlProps) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      {helpText && (
        <p className="text-xs text-[var(--text-muted)] mb-3">
          {helpText}
        </p>
      )}
      <div className="flex gap-2">
        {values.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              value === val
                ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                : "bg-[var(--card-bg)] border-[var(--card-border)] text-foreground hover:bg-[var(--accent-light)]/20"
            }`}
          >
            {val}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs text-[var(--text-muted)]">
        {values.map((val, index) => {
          const label = labels[val];
          if (!label) return null;
          return (
            <span key={val}>
              <span className={value === val ? "font-medium text-foreground" : ""}>
                {val}: {label[lang] ?? label.ko}
              </span>
              {index < values.length - 1 && " · "}
            </span>
          );
        })}
      </div>
    </div>
  );
}

