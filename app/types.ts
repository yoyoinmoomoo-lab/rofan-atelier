// 문화권 타입
export type Culture = "anglo" | "france" | "germanic" | "slavic" | "latin" | "greek";

// 시대감 타입
export type Era = "medieval" | "romantic" | "modern19";

// 계급 타입
export type Class = "noble" | "commoner";

// 성별 타입
export type Gender = "female" | "male";

// 이름 생성 요청
export interface GenerateNamesRequest {
  culture: Culture;
  gender: Gender;
  class: Class;
  era: Era;
  includeNickname: boolean;
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

