import type { Class as ClassType, LangCode } from "@/app/types";

const CLASS_LABELS: Record<LangCode, Record<ClassType, string>> = {
  ko: {
    royal: "왕족",
    noble: "귀족",
    commoner: "서민",
  },
  en: {
    royal: "royal",
    noble: "noble",
    commoner: "commoner",
  },
};

export function getDisplayClassLabel(lang: LangCode, classKey: ClassType): string {
  const langLabels = CLASS_LABELS[lang] ?? CLASS_LABELS.ko;
  return langLabels[classKey] ?? classKey;
}

