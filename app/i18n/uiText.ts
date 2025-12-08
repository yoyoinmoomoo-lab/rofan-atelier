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
  characterTabLabel: {
    ko: "캐릭터 이름 생성",
    en: "Character names",
  },
  nameGeneratorTitle: {
    ko: "이름 생성하기",
    en: "Generate Names",
  },
  nameGeneratorDescription: {
    ko: "문화권과 성별, 계급을 선택하면 로판에 어울리는 이름과 애칭을 만들어줍니다.",
    en: "Select culture, gender, and class to generate names and nicknames that fit romance fantasy novels.",
  },
  familyGeneratorTitle: {
    ko: "가문명 생성하기",
    en: "Generate Family Names",
  },
  familyGeneratorDescription: {
    ko: "세계관에 맞는 귀족 가문 이름과 간단한 설명을 만들어줍니다.",
    en: "Generate noble family names and brief descriptions that match your world setting.",
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
  // 메타데이터
  metaTitle: {
    ko: "로판 아틀리에 – 로맨스 판타지 세계관 이름 생성기",
    en: "Rofan Atelier – Romance Fantasy Name Generator",
  },
  metaDescription: {
    ko: "로맨스 판타지 세계를 위한 이름과 가문명을 빚어드립니다. 서양식 이름, 귀족 가문명, 세계관 설정까지 한 번에.",
    en: "Crafting names and family names for your romance fantasy world. Western-style names, noble family names, and worldbuilding settings all in one.",
  },
  metaOgTitle: {
    ko: "로판 아틀리에",
    en: "Rofan Atelier",
  },
  metaOgDescription: {
    ko: "당신의 이야기 속 인물들의 이름과 가문명을 찾아드립니다.",
    en: "Find names and family names for the characters in your story.",
  },
  metaTwitterTitle: {
    ko: "로판 아틀리에",
    en: "Rofan Atelier",
  },
  metaTwitterDescription: {
    ko: "한국 웹소설 작가를 위한 로맨스 판타지 이름·가문 생성 도구.",
    en: "Romance fantasy name and family name generator for Korean web novel writers.",
  },
  // 공통 UI 메시지
  commonLoading: {
    ko: "로딩 중...",
    en: "Loading...",
  },
  commonError: {
    ko: "오류가 발생했습니다.",
    en: "An error occurred.",
  },
  emptyStateNoResult: {
    ko: "결과가 없습니다.",
    en: "No results found.",
  },
  // Visualboard 관련
  visualboardTitle: {
    ko: "시각화 보드",
    en: "Visual Board",
  },
  visualboardSceneLabel: {
    ko: "장면",
    en: "Scene",
  },
  visualboardCharactersLabel: {
    ko: "등장인물",
    en: "Characters",
  },
  visualboardRelationsLabel: {
    ko: "관계",
    en: "Relations",
  },
  visualboardTensionLabel: {
    ko: "긴장도",
    en: "Tension",
  },
  visualboardAffectionLabel: {
    ko: "호감도",
    en: "Affection",
  },
  visualboardDialogueImpactLow: {
    ko: "낮음",
    en: "Low",
  },
  visualboardDialogueImpactMedium: {
    ko: "보통",
    en: "Medium",
  },
  visualboardDialogueImpactHigh: {
    ko: "높음",
    en: "High",
  },
  visualboardDialogueImpactLabel: {
    ko: "대화 강도",
    en: "Dialogue Impact",
  },
  visualboardNoCharacters: {
    ko: "등장인물이 없습니다.",
    en: "No characters found.",
  },
  visualboardNoState: {
    ko: "장면 정보가 없습니다. 텍스트를 입력하고 분석해주세요.",
    en: "No scene information. Please enter text and analyze.",
  },
  visualboardCurrentSceneTitle: {
    ko: "현재 장면",
    en: "Current Scene",
  },
  visualboardCharacterStatusTitle: {
    ko: "캐릭터 상태",
    en: "Character Status",
  },
  visualboardEmptyMessageEmbed: {
    ko: "장면 정보가 없습니다. 사이드패널에서 \"최근 턴 분석하기\"를 눌러 보드를 업데이트해주세요.",
    en: "No scene information. Please click \"Analyze Recent Turn\" in the side panel to update the board.",
  },
  visualboardBackstageCastTitle: {
    ko: "백스테이지 캐스트",
    en: "Backstage Cast",
  },
  castGenderMale: {
    ko: "남자",
    en: "Male",
  },
  castGenderFemale: {
    ko: "여자",
    en: "Female",
  },
  castGenderUnknown: {
    ko: "모름",
    en: "Unknown",
  },
  castOnStage: {
    ko: "무대 위",
    en: "On Stage",
  },
  visualboardNoRelations: {
    ko: "관계 정보가 없습니다.",
    en: "No relations found.",
  },
  // 테스트 보드 관련
  testBoardTitle: {
    ko: "Visualboard 테스트",
    en: "Visualboard Test",
  },
  testBoardDescription: {
    ko: "소설 텍스트를 입력하면 등장인물, 장면, 관계를 시각화합니다.",
    en: "Enter novel text to visualize characters, scenes, and relationships.",
  },
  testBoardInputLabel: {
    ko: "소설 텍스트 입력",
    en: "Enter Novel Text",
  },
  testBoardInputPlaceholder: {
    ko: "황녀 아리아드네는 차가운 눈빛으로 공작을 내려다보았다. 화려한 연회장이었지만 그녀의 주변엔 냉기가 흘렀다. 공작은 당황하여 뒷걸음질 쳤다.",
    en: "Princess Ariadne looked down at the duke with cold eyes. Although it was a splendid banquet hall, a chill flowed around her. The duke panicked and stepped back.",
  },
  testBoardAnalyzeButton: {
    ko: "분석하기",
    en: "Analyze",
  },
  testBoardError: {
    ko: "분석 중 오류가 발생했습니다.",
    en: "An error occurred during analysis.",
  },
  testBoardBetaBadge: {
    ko: "Beta",
    en: "Beta",
  },
  testBoardManualInputToggle: {
    ko: "직접 텍스트로 테스트하기 (개발자용)",
    en: "Test with manual text input (Developer)",
  },
  visualboardWindowInfo: {
    ko: "이 보드는 현재 브라우저 창의 AI 대화를 시각화합니다. 서로 다른 대화를 각각 다른 보드로 보고 싶다면 새 창을 열어 이 확장 프로그램을 다시 열어주세요.",
    en: "This board visualizes AI conversations in the current browser window. To view different conversations in separate boards, open a new window and open this extension again.",
  },
} as const;

export type UITextKey = keyof typeof UI_TEXT;

export function getUIText(key: UITextKey, lang: LangCode): string {
  const item = UI_TEXT[key];
  if (!item) return "";
  return item[lang] ?? item.ko;
}

