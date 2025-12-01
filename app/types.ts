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

