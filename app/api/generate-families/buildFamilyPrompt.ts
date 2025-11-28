import type { LangCode } from "@/app/types";
import type { GenerationProfile } from "@/config/generationProfile";

export type BuildFamilyPromptArgs = {
  lang: LangCode;
  cultureEng: string;
  classLabelEn: string;
  eraLabelEn: string;
  profile: GenerationProfile;
};

const WORLD_RULES = [
  "Family names must exist naturally within the selected culture, class, and era.",
  "Keep pronunciation, tone, and meaning consistent as if the houses belong to the same world.",
  "Avoid mixing dissonant cultures; do not blend Slavic, Anglo, and Greek elements in a single entry.",
  "Exclude parody, overly fantastical spellings, or artificial suffixes like -xas or -'tor.",
];

const FORMAT_RULES = [
  "Generate only Western-style family/house names (no titles, honorifics, or personal first names).",
  "Provide Korean transliterations using pure Hangul with no Latin letters, numbers, or symbols.",
  "Roman spellings must use Latin letters only; do not include Hangul or accents outside the expected culture.",
];

const DIVERSITY_RULES = [
  "Mix traditional real family names with romance-fantasy variants, while keeping them culturally plausible.",
  "Royal/noble houses should feel ceremonial or lineage-rich; commoner houses should evoke regions or professions.",
  "Vary syllable patterns, endings, and tones to avoid repetitive structures across the ten results.",
];

export function buildFamilyPrompt({
  lang,
  cultureEng,
  classLabelEn,
  eraLabelEn,
  profile,
}: BuildFamilyPromptArgs): string {
  const { fieldLanguages } = profile;
  const languageStacks = lang === "ko" ? "Korean" : "English";

  const sections = [
    "You are an AI specialist generating Western-style family/house names for Korean romance fantasy writers.",
    `[Input Conditions]
- Culture (English description): ${cultureEng}
- Class (GPT label): ${classLabelEn}
- Era (GPT label): ${eraLabelEn}`,
    `[Worldbuilding Rules]
${WORLD_RULES.map((line, idx) => `${idx + 1}. ${line}`).join("\n")}`,
    `[Format Rules]
${FORMAT_RULES.map((line, idx) => `${idx + 1}. ${line}`).join("\n")}`,
    `[Diversity & Character]
${DIVERSITY_RULES.map((line, idx) => `${idx + 1}. ${line}`).join("\n")}`,
    `[Field Language Requirements]
- "korean": ${fieldLanguages.korean}
- "roman": ${fieldLanguages.roman}
- "tone": ${fieldLanguages.classTone}
- "desc": ${fieldLanguages.desc}`,
    `[Keywords]
- Provide 2~3 short keywords for each entry that capture the family's vibe. Keywords should follow the same language mode above.`,
    `[Output Format]
Generate exactly 10 family names with the JSON structure below. Each keywords array should contain strings.
{
  "families": [
    {
      "korean": "",
      "roman": "",
      "tone": "",
      "keywords": ["", ""],
      "desc": ""
    }
  ]
}
Return ONLY pure JSON. Do NOT include any extra text.
Use ${languageStacks} for tone and desc outputs as instructed above.`,
  ];

  return sections.join("\n\n");
}

