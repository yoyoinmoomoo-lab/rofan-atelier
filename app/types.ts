// 문화권 타입
export type Culture = "anglo" | "france" | "germanic" | "slavic" | "latin" | "greek";

// 시대감 타입
export type Era = "medieval" | "romantic" | "modern19";

// 계급 타입
export type Class = "royal" | "noble" | "commoner";

// 성별 타입
export type Gender = "female" | "male" | "neutral";

// UI/프롬프트 언어 코드
export type LangCode = "ko" | "en";

// 이름 생성 요청
export interface GenerateNamesRequest {
  culture: Culture;
  gender: Gender;
  class: Class;
  era: Era;
  includeNickname: boolean;
  lang?: LangCode;
}

// 이름 생성 응답
export interface NameResult {
  korean: string;
  roman: string;
  classTone: string;
  nicknameRoman?: string;
  nicknameKorean?: string;
  desc: string;
}

export interface GenerateNamesResponse {
  names: NameResult[];
}

// 가문명 생성 요청
export interface GenerateFamiliesRequest {
  culture: Culture;
  class: Class;
  era: Era;
  lang?: LangCode;
}

// 가문명 생성 응답
export interface FamilyResult {
  korean: string;
  roman: string;
  tone: string;
  keywords: string[];
  desc: string;
}

export interface GenerateFamiliesResponse {
  families: FamilyResult[];
}

// 캐릭터 이름 생성기 - 입력 상태
export interface NameInputState {
  gender: Gender;
  tone_strength: number;      // 어조 강도 (1~5)
  eraLevel: number;            // 시대감 (1~5): 1=신화/고대, 5=근현대/모던
  characterPrompt: string;     // 캐릭터 설명 (선택, 최대 80자)
}

// 캐릭터 이름 생성기 - 결과
export interface CharacterNameResult {
  name_kor: string; // 한글 표기
  name_rom: string; // 로마자 표기
  desc: string;     // 어원을 포함한 설명 (1-2문장, output_language에 따른 언어)
}

// 캐릭터 이름 생성 요청
export interface GenerateCharacterNamesRequest {
  gender: Gender;
  tone_strength: number;       // 1~5: 부드러움 ↔ 강함
  eraLevel: number;             // 1~5: 고대 ↔ 현대
  characterPrompt?: string;     // 캐릭터 설명 (선택, 최대 80자)
  lang?: LangCode;              // UI 언어 (output_language로도 사용)
}

// 캐릭터 이름 생성 응답
export interface GenerateCharacterNamesResponse {
  names: CharacterNameResult[];
}

// Visualboard 관련 타입
export type SceneType = "castle" | "room" | "garden" | "hall" | "carriage" | "forest";

export type CharacterSlot = "left" | "center" | "right";

// 캐릭터 무드 라벨 타입
export type MoodLabel = "joy" | "tension" | "anger" | "sadness" | "fear" | "surprise" | "neutral" | "love" | "contempt";

// 캐릭터 무드 객체
export interface CharacterMoodState {
  label: MoodLabel;
  description: string; // 감정 상태에 대한 간단한 설명 (1-2문장)
}

export interface StoryState {
  scene: {
    summary: string; // 장면 한 줄 요약
    type: SceneType;
    visualKey?: string; // v0.2: 장면 비주얼 키 (예: 'ballroom', 'bedroom', 'street')
    location_name?: string; // v0.2: 구체적인 장소 이름 (예: '왕궁 연회장', '서재')
    backdrop_style?: string; // v0.2: 배경 스타일 설명 (예: '화려한 샹들리에가 달린', '어두운')
  };
  characters: Array<{
    name: string;
    slot: CharacterSlot;
    moodState?: CharacterMoodState; // 상세한 무드 정보
    visualKey?: string; // 캐릭터 비주얼 키 (예: 'liliana', 'rebon')
  }>;
  relations: Array<{
    a: string; // 캐릭터 A 이름
    b: string; // 캐릭터 B 이름
    tension: number;   // 0~100 (긴장도)
    affection: number; // 0~100 (호감도)
  }>;
  dialogue_impact: "low" | "medium" | "high"; // 화면 연출 강도
}

export interface AnalyzeChatRequest {
  chatText: string;
  previousState?: StoryState; // 이전 장면 상태 (선택적)
}

export interface AnalyzeChatResponse {
  state: StoryState;
}

