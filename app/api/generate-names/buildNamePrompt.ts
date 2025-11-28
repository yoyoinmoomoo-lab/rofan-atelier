import type { LangCode } from "@/app/types";
import type { GenerationProfile } from "@/config/generationProfile";

export type BuildNamePromptArgs = {
  lang: LangCode;
  cultureEng: string;
  genderLabelEn: string;
  classLabelEn: string;
  eraLabelEn: string;
  includeNickname: boolean;
  profile: GenerationProfile;
};

const WORLD_RULES = [
  "Names must feel like they can exist within the selected culture, class, and era.",
  "Tone, pronunciation, and etymology should feel consistent as if the people come from the same family/house/region.",
  "Never mix dissonant cultures. Avoid combinations that feel like a mashup of Slavic, Anglo, and Greek elements in one name.",
  "Avoid absurd, parody, or overly fantastical names. Acceptable examples are subtle romance fantasy twists on real Western names (Aveline → Avelyne).",
];

const FORMAT_RULES = [
  "Generate ONLY first names. Do not include surnames, family names, titles, or honorifics.",
  "Provide Korean Hangul transliterations for the romanized names. Make sure the Hangul reads naturally.",
  "Romanized names must use Latin letters only. Do not insert Korean characters into the roman field.",
  "Do not repeat the name inside its own description.",
];

const DIVERSITY_RULES = [
  "Vary ending syllables (-a, -e, -ine, -elle, -eth, -is, -lin, -ra, etc.), and keep names ending in -a to at most three out of ten.",
  "Blend actual Western names with romance-fantasy variants.",
  "Use 2 to 4 syllables with a mix of syllable patterns.",
  "Royal or noble characters should feel elegant and longer; commoners can feel shorter and simpler.",
];

const NICKNAME_RULES = [
  "If includeNickname is true, provide both nicknameRoman and nicknameKorean as single words with Latin letters for nicknameRoman and Hangul transliteration for nicknameKorean.",
  "If includeNickname is false, return empty strings for nicknameRoman and nicknameKorean.",
];

export function buildNamePrompt({
  lang,
  cultureEng,
  genderLabelEn,
  classLabelEn,
  eraLabelEn,
  includeNickname,
  profile,
}: BuildNamePromptArgs): string {
  const { fieldLanguages } = profile;
  const nicknameRequirement = includeNickname ? "Yes" : "No";
  const languageDisplay = lang === "ko" ? "Korean" : "English";

  const sections = [
    "You are an AI name generator specialized in Western-style given names for Korean romance fantasy (Rofan) writers.",
    `[Input Conditions]
- Culture (English description): ${cultureEng}
- Gender (GPT label): ${genderLabelEn}
- Class (GPT label): ${classLabelEn}
- Era (GPT label): ${eraLabelEn}
- Include nickname: ${nicknameRequirement}`,
    `[Worldbuilding & Tone Consistency Rules]
${WORLD_RULES.map((line, index) => `${index + 1}. ${line}`).join("\n")}`,
    `[Format Rules]
${FORMAT_RULES.map((line, index) => `${index + 1}. ${line}`).join("\n")}`,
    `[Nickname Rules]
${NICKNAME_RULES.map((line, index) => `${index + 1}. ${line}`).join("\n")}`,
    `[Diversity Rules]
${DIVERSITY_RULES.map((line, index) => `${index + 1}. ${line}`).join("\n")}`,
    `[Field Language Requirements]
- "korean": ${fieldLanguages.korean}
- "roman": ${fieldLanguages.roman}
- "classTone": ${fieldLanguages.classTone}
- "nicknameRoman": ${fieldLanguages.nicknameRoman}
- "nicknameKorean": ${fieldLanguages.nicknameKorean}
- "desc": ${fieldLanguages.desc}`,
    `[Language Mode]
Use ${languageDisplay} for tone and description fields, following the language instructions above.`,
    `[Output Format]
Generate exactly 10 names using the JSON structure below. Use Latin letters wherever required and keep descriptions short.
{
  "names": [
    {
      "korean": "",
      "roman": "",
      "classTone": "",
      "nicknameRoman": "",
      "nicknameKorean": "",
      "desc": ""
    }
  ]
}
Return ONLY pure JSON. Do NOT include any extra text.`,
  ];

  return sections.join("\n\n");
}

