import type { LangCode } from "@/app/types";

export type FieldLanguageProfile = {
  korean: string;
  roman: string;
  nicknameRoman: string;
  nicknameKorean: string;
  classTone: string;
  desc: string;
};

export type GenerationProfile = {
  fieldLanguages: FieldLanguageProfile;
  classToneFallback: (classLabelEn: string, classLabelKo?: string) => string;
};

const KO_FIELD_LANGUAGES: FieldLanguageProfile = {
  korean: "Pure Korean Hangul transliteration of the romanized name without Latin letters, accents, or parentheses.",
  roman: "Latin alphabet, culture-appropriate spelling without romanization shortcuts.",
  nicknameRoman: "Western-style nickname in Latin letters that feels playful yet grounded.",
  nicknameKorean: "Korean Hangul transliteration of the nicknameRoman field.",
  classTone: "Korean description or toneword for the character's social class.",
  desc: "Short Korean keyword-like descriptors, around 20 characters.",
};

const EN_FIELD_LANGUAGES: FieldLanguageProfile = {
  korean: "Korean Hangul transliteration of the romanized name (for reference only).",
  roman: "Latin letters, culturally accurate and natural for the selected region.",
  nicknameRoman: "Latin-letter nickname that fits the romanized name organically.",
  nicknameKorean: "Korean Hangul transliteration of the nicknameRoman for reference.",
  classTone: "English tone descriptions such as \"royal\" or \"graceful\".",
  desc: "Short English keywords or phrases describing the name's vibe.",
};

export const GENERATION_PROFILES: Record<LangCode, GenerationProfile> = {
  ko: {
    fieldLanguages: KO_FIELD_LANGUAGES,
    classToneFallback: (classLabelEn, classLabelKo) =>
      classLabelKo ? `${classLabelKo}풍` : `${classLabelEn}풍`,
  },
  en: {
    fieldLanguages: EN_FIELD_LANGUAGES,
    classToneFallback: (classLabelEn) => `${classLabelEn} style`,
  },
};

