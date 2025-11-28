import { Culture, Era, Class, Gender, LangCode } from "./types";

type LangLabel = { ko: string; en: string };

// 문화권 옵션
export const CULTURE_OPTIONS: { value: Culture; label: LangLabel }[] = [
  { value: "anglo", label: { ko: "영미권", en: "Anglo" } },
  { value: "france", label: { ko: "프랑스", en: "France" } },
  { value: "germanic", label: { ko: "독일/북유럽", en: "Germanic/Nordic" } },
  { value: "slavic", label: { ko: "슬라브", en: "Slavic" } },
  { value: "latin", label: { ko: "라틴(스페인/이탈리아)", en: "Latin" } },
  { value: "greek", label: { ko: "그리스", en: "Greek" } },
];

// 시대감 옵션
export const ERA_OPTIONS: { value: Era; label: LangLabel }[] = [
  { value: "medieval", label: { ko: "중세풍", en: "Medieval" } },
  { value: "romantic", label: { ko: "낭만풍", en: "Romantic" } },
  { value: "modern19", label: { ko: "근대 19세기풍", en: "19th century style" } },
];

// 계급 옵션
export const CLASS_OPTIONS: { value: Class; label: LangLabel }[] = [
  { value: "noble", label: { ko: "귀족", en: "Noble" } },
  { value: "commoner", label: { ko: "서민", en: "Commoner" } },
];

// 성별 옵션
export const GENDER_OPTIONS: { value: Gender; label: LangLabel }[] = [
  { value: "female", label: { ko: "여성", en: "Female" } },
  { value: "male", label: { ko: "남성", en: "Male" } },
];

export const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
];

