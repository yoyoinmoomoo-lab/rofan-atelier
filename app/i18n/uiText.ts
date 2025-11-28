import type { LangCode } from "@/app/types";

const UI_TEXT = {
  appTitle: {
    ko: "로판 아틀리에",
    en: "Rofan Atelier",
  },
  appSubtitle: {
    ko: "당신의 세계를 위한 이름과 설정을 빚어드립니다.",
    en: "Crafting names and settings for your world.",
  },
  namesTabLabel: {
    ko: "이름 생성",
    en: "Given Names",
  },
  familiesTabLabel: {
    ko: "가문명 생성",
    en: "Family Names",
  },
  cultureLabel: {
    ko: "문화권",
    en: "Culture",
  },
  genderLabel: {
    ko: "성별",
    en: "Gender",
  },
  classLabel: {
    ko: "계급",
    en: "Class",
  },
  eraLabel: {
    ko: "시대감",
    en: "Era",
  },
  includeNicknameLabel: {
    ko: "애칭 포함하기",
    en: "Include nickname",
  },
  generateNamesButton: {
    ko: "이름 10개 생성하기",
    en: "Generate 10 names",
  },
  generateFamiliesButton: {
    ko: "가문명 10개 생성하기",
    en: "Generate 10 family names",
  },
  copyNameButton: {
    ko: "이름만 복사",
    en: "Copy name only",
  },
  copyFullButton: {
    ko: "전체 복사",
    en: "Copy all",
  },
  copyFamilyButton: {
    ko: "가문명 복사",
    en: "Copy family name",
  },
  nicknameLabel: {
    ko: "애칭:",
    en: "Nickname:",
  },
  keywordsLabel: {
    ko: "키워드:",
    en: "Keywords:",
  },
  descriptionLabel: {
    ko: "설명:",
    en: "Description:",
  },
  generatingText: {
    ko: "생성 중...",
    en: "Generating...",
  },
  copySuccessMessage: {
    ko: "복사되었습니다 ✧",
    en: "Copied ✧",
  },
  footerPoweredBy: {
    ko: "Powered by OpenAI gpt-4o-mini · Beta",
    en: "Powered by OpenAI gpt-4o-mini · Beta",
  },
  footerDescription: {
    ko: "한국 로판 작가를 위한 서양식 이름 생성 전용 · 결과는 테스트 중이며 부정확할 수 있습니다",
    en: "Western-style name generator for Korean romance fantasy writers · Results are in testing and may be inaccurate",
  },
  errorGenerateNames: {
    ko: "이름 생성에 실패했습니다.",
    en: "Failed to generate names.",
  },
  errorGenerateFamilies: {
    ko: "가문명 생성에 실패했습니다.",
    en: "Failed to generate family names.",
  },
  feedbackToggle: {
    ko: "💬 피드백 남기기",
    en: "💬 Leave feedback",
  },
  feedbackPlaceholder: {
    ko: "불편한 점이나 개선 아이디어를 적어주세요.",
    en: "Tell me what's inconvenient or what you'd like to improve.",
  },
  feedbackNoteAnonymous: {
    ko: "* 입력 내용은 제작자에게 익명으로 전달됩니다.",
    en: "* Your message will be sent anonymously.",
  },
  feedbackNoteMinLength: {
    ko: "* 최소 3자 이상 입력해주세요.",
    en: "* Please enter at least 3 characters.",
  },
  feedbackSubmitButton: {
    ko: "피드백 보내기",
    en: "Send feedback",
  },
  feedbackSending: {
    ko: "전송 중…",
    en: "Sending...",
  },
  feedbackSuccess: {
    ko: "감사합니다! 잘 받았어요 🙏",
    en: "Thank you! We received your feedback 🙏",
  },
  feedbackError: {
    ko: "전송에 실패했습니다. 잠시 후 다시 시도해주세요.",
    en: "Failed to send. Please try again later.",
  },
} as const;

export type UITextKey = keyof typeof UI_TEXT;

export function getUIText(key: UITextKey, lang: LangCode): string {
  const item = UI_TEXT[key];
  if (!item) return "";
  return item[lang] ?? item.ko;
}

