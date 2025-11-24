import { Culture, Era, Class, Gender } from "./types";

// 문화권 옵션
export const CULTURE_OPTIONS: { value: Culture; label: string }[] = [
  { value: "anglo", label: "영미" },
  { value: "france", label: "프랑스" },
  { value: "germanic", label: "게르만(독일·북유럽)" },
  { value: "slavic", label: "러시아·슬라브" },
  { value: "latin", label: "스페인·라틴" },
  { value: "greek", label: "그리스" },
];

// 시대감 옵션
export const ERA_OPTIONS: { value: Era; label: string }[] = [
  { value: "medieval", label: "중세풍" },
  { value: "romantic", label: "낭만풍" },
  { value: "modern19", label: "근대 19세기풍" },
];

// 계급 옵션
export const CLASS_OPTIONS: { value: Class; label: string }[] = [
  { value: "noble", label: "귀족" },
  { value: "commoner", label: "서민" },
];

// 성별 옵션
export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
];

