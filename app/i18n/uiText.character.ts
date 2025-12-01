import type { LangCode } from "@/app/types";

const CHARACTER_UI_TEXT = {
  title: {
    ko: "캐릭터 이름 생성하기",
    en: "Generate Character Names",
  },
  description: {
    ko: "성격·특징·세계관을 조합해 캐릭터 이름과 어원을 자동 생성합니다.",
    en: "Generate character names and etymology from personality, traits and world settings.",
  },
  intro_guide: {
    ko: "캐릭터 설정을 입력하면, 분위기에 맞는 이름과 1–2문장 설명을 만들어줍니다.",
    en: "Describe your character, and this tool will suggest fitting names with a short 1–2 sentence explanation.",
  },
  field_explain_etymology: {
    ko: "어원: 라틴어, 그리스어, 노르드어 등 실제 언어에서 착안한 어근과 의미를 설명합니다. 판타지 세계관에서 그럴듯하게 느껴지는 '현실 기반 설명'입니다.",
    en: "Etymology: explains which real-world language roots (Latin, Greek, Norse, etc.) inspired the name and how their meanings are combined.",
  },
  field_explain_story: {
    ko: "이야기: 이 이름을 가진 캐릭터가 어떤 평판과 분위기를 갖는지, 세계관 속에서 어떻게 받아들여지는지 짧은 스토리 형태로 보여줍니다.",
    en: "Story: a short lore-style note about what kind of character usually bears this name and how it is perceived in the world.",
  },
  gender_label: { ko: "성별", en: "Gender" },
  character_prompt_label: {
    ko: "캐릭터 설명 (선택)",
    en: "Character Prompt (optional)",
  },
  character_prompt_help: {
    ko: "한 줄로 캐릭터를 설명해 주세요. 비워 둬도 됩니다.",
    en: "Describe your character in one line. Leave it empty if not needed.",
  },
  character_prompt_placeholder: {
    ko: "척박한 북쪽 영지를 지키는 흑발 붉은 눈의 북부 대공",
    en: "A black-haired, red-eyed duke ruling a harsh northern territory",
  },
  tone_1: {
    ko: "1: 포근함",
    en: "1: Gentle",
  },
  tone_2: {
    ko: "2: 부드러움",
    en: "2: Soft",
  },
  tone_3: {
    ko: "3: 중간",
    en: "3: Balanced",
  },
  tone_4: {
    ko: "4: 강렬함",
    en: "4: Intense",
  },
  tone_5: {
    ko: "5: 매우 강렬",
    en: "5: Very Intense",
  },
  tone_label: {
    ko: "어조 강도",
    en: "Tone Strength",
  },
  tone_help: {
    ko: "1은 포근하고 섬세한 느낌, 5는 어둡고 카리스마 있는 느낌이에요.",
    en: "1 is soft and delicate, 5 is dark and charismatic.",
  },
  tone_soft: {
    ko: "부드러움",
    en: "Soft",
  },
  tone_intense: {
    ko: "강렬함",
    en: "Intense",
  },
  era_label: {
    ko: "시대감",
    en: "Era",
  },
  era_help: {
    ko: "1은 신화·고대, 5는 현대에 가까운 느낌이에요.",
    en: "1 is mythic/ancient, 5 is closer to modern fantasy.",
  },
  era_1: {
    ko: "1: 신화·고대",
    en: "1: Mythic/Ancient",
  },
  era_3: {
    ko: "3: 중세~근세",
    en: "3: Medieval~Early Modern",
  },
  era_5: {
    ko: "5: 근현대~모던",
    en: "5: Modern~Contemporary",
  },
  generate_button: {
    ko: "이름 5개 생성하기",
    en: "Generate 5 names",
  },
  generatingText: {
    ko: "생성 중...",
    en: "Generating...",
  },
  regenerate_button: {
    ko: "다시 생성하기",
    en: "Regenerate",
  },
  reset_button: {
    ko: "선택 초기화",
    en: "Reset selections",
  },
  result_title: {
    ko: "생성된 캐릭터 이름",
    en: "Generated character names",
  },
  etymology_label: {
    ko: "어원",
    en: "Etymology",
  },
  world_fit_label: {
    ko: "이야기",
    en: "Story",
  },
  copyNameButton: {
    ko: "이름만 복사",
    en: "Copy name",
  },
  copyFullButton: {
    ko: "전체 복사",
    en: "Copy all",
  },
  copySuccessMessage: {
    ko: "복사되었습니다 ✧",
    en: "Copied ✧",
  },
  empty_state_message: {
    ko: "조건을 선택한 다음 '이름 5개 생성하기'를 눌러보세요.",
    en: "Select some options and click “Generate 5 names”.",
  },
  error_no_world_selected: {
    ko: "세계관을 1개 선택해주세요.",
    en: "Please select exactly one world.",
  },
  error_max_personality: {
    ko: "성격 태그는 최대 2개까지 선택 가능합니다.",
    en: "You can select up to 2 personality tags.",
  },
  error_max_trait: {
    ko: "특징 태그는 최대 2개까지 선택 가능합니다.",
    en: "You can select up to 2 trait tags.",
  },
  error_custom_note_too_long: {
    ko: "추가 설명은 50자 이내로 입력해주세요.",
    en: "Additional note must be 50 characters or less.",
  },
  error_openai: {
    ko: "이름 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    en: "An error occurred while generating names. Please try again later.",
  },
  error_invalid_response: {
    ko: "응답 형식이 올바르지 않습니다.",
    en: "Invalid response format.",
  },
  error_server: {
    ko: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    en: "A server error occurred. Please try again later.",
  },
} as const;

export type CharacterUITextKey = keyof typeof CHARACTER_UI_TEXT;

export function getCharacterUIText(
  key: CharacterUITextKey,
  lang: LangCode
): string {
  const item = CHARACTER_UI_TEXT[key];
  if (!item) return "";
  return item[lang] ?? item.ko;
}

