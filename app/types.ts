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

// Step3: Scene 타입 정의 (장면별 독립 구조)
export interface Scene {
  summary: string; // 장면 한 줄 요약
  type: SceneType;
  visualKey?: string; // v0.2: 장면 비주얼 키 (예: 'ballroom', 'bedroom', 'street')
  location_name?: string; // v0.2: 구체적인 장소 이름 (예: '왕궁 연회장', '서재')
  backdrop_style?: string; // v0.2: 배경 스타일 설명 (예: '화려한 샹들리에가 달린', '어두운')
  characters: Array<{
    name: string;
    slot?: CharacterSlot; // optional: 무대에 표시할 주요 캐릭터만 지정, 없으면 backstage로 표시
    moodState?: CharacterMoodState; // 상세한 무드 정보
    visualKey?: string; // 캐릭터 비주얼 키 (예: 'liliana', 'rebon')
    // Step4: 캐릭터 매칭 필드 (optional, 하위 호환성)
    refId?: string; // 기존 캐릭터 ID (매칭 성공 시)
    isNew?: boolean; // 신규 캐릭터 여부 (매칭 실패 시)
  }>;
  dialogue_impact: "low" | "medium" | "high"; // 화면 연출 강도
}

/**
 * StoryState (v1/v2 호환)
 * 
 * @deprecated v1 필드들 (scene, characters, relations, dialogue_impact):
 *   - 하위 호환성을 위해 유지되지만, v2에서는 scenes[] 사용을 권장
 *   - API에서 v1 응답을 받으면 scenes[]로 normalize 처리
 * 
 * v2 구조:
 *   - scenes: Scene[] (필수) - Multi-scene 지원
 *   - activeSceneIndex?: number - 현재 활성 장면 인덱스 (기본값: scenes.length - 1)
 */
export interface StoryState {
  // Step3: Multi-scene 지원 (v2)
  scenes?: Scene[]; // 장면 배열 (v2에서는 필수, legacy 허용을 위해 optional)
  activeSceneIndex?: number; // 현재 활성 장면 인덱스 (기본값: 마지막 장면)
  
  // v1 필드들 (deprecated, 하위 호환성 유지)
  /** @deprecated v2에서는 scenes[] 사용 */
  scene?: {
    summary: string; // 장면 한 줄 요약
    type: SceneType;
    visualKey?: string; // v0.2: 장면 비주얼 키 (예: 'ballroom', 'bedroom', 'street')
    location_name?: string; // v0.2: 구체적인 장소 이름 (예: '왕궁 연회장', '서재')
    backdrop_style?: string; // v0.2: 배경 스타일 설명 (예: '화려한 샹들리에가 달린', '어두운')
  };
  /** @deprecated v2에서는 각 Scene.characters 사용 */
  characters?: Array<{
    name: string;
    slot: CharacterSlot;
    moodState?: CharacterMoodState; // 상세한 무드 정보
    visualKey?: string; // 캐릭터 비주얼 키 (예: 'liliana', 'rebon')
  }>;
  /** @deprecated v2에서는 사용하지 않음 */
  relations?: Array<{
    a: string; // 캐릭터 A 이름
    b: string; // 캐릭터 B 이름
    tension: number;   // 0~100 (긴장도)
    affection: number; // 0~100 (호감도)
  }>;
  /** @deprecated v2에서는 각 Scene.dialogue_impact 사용 */
  dialogue_impact?: "low" | "medium" | "high"; // 화면 연출 강도
}

/**
 * StoryStateV2: v2 완전한 구조 (scenes 필수)
 * 
 * API/Extension/UI에서 normalize 후 사용하는 목표 타입
 */
export type StoryStateV2 = Omit<StoryState, "scenes"> & {
  scenes: Scene[]; // 필수
  activeSceneIndex?: number; // 기본값: scenes.length - 1
};

// Step4: CastHint - API 요청 시 기존 캐릭터 컨텍스트 제공
export interface CastHint {
  id?: string; // 캐릭터 UUID (refId로 사용, optional: previousState fallback은 id 없음)
  canonicalName: string; // 정식 이름
  aliases: string[]; // 별칭 목록 (매칭용)
  gender: CastGender; // 성별 (선택적 힌트)
}

export interface AnalyzeChatRequest {
  chatText: string;
  previousState?: StoryState; // 이전 장면 상태 (선택적)
  castHints?: CastHint[]; // Step4: 기존 캐릭터 컨텍스트 (optional, 하위 호환성)
  botContext?: { 
    charName?: string; // 캐릭터 이름 (optional)
    persona: string; 
    worldview: string; 
    userName?: string; 
    userPersona?: string; 
  }; // bot/persona/worldview + user 컨텍스트 (optional)
}

export interface AnalyzeChatResponse {
  state: StoryState;
}

// ============================================================================
// Phase2: Storage v2 타입 정의
// ============================================================================

// 캐스트 저장 v2 구조
export type CastGender = "male" | "female" | "unknown";

export interface BackstageCastEntryV2 {
  id: string; // UUID (crypto.randomUUID())
  canonicalName: string; // 정식 이름 (예: "페스텔 메비헤르")
  aliases: string[]; // 별칭 목록 (예: ["페스텔", "페스텔 황태자", "황태자 전하"])
  gender: CastGender;
  isGhost?: boolean; // Ghost 캐릭터 여부
  // 선택적 필드
  title?: string; // 직함 (예: "황태자")
  pinned?: boolean; // 상단 고정 (⭐)
  hidden?: boolean; // 숨김 (🙈)
  memo?: string; // 사용자 메모
}

export interface CastStoreV2 {
  version: "v2";
  charactersById: Record<string, BackstageCastEntryV2>; // id -> entry
  aliasMap: Record<string, string>; // normalized alias -> id
}

// 하위 호환성: v1 타입 (마이그레이션용)
export interface BackstageCastEntryV1 {
  name: string;
  gender: CastGender;
}

export type BackstageCastStateV1 = BackstageCastEntryV1[];

// LastSuccessRecord: 시나리오별 최근 성공 기록
export interface LastSuccessRecord {
  turnId: string; // textHash 기반 또는 messageId (예: "123:페스텔이 연회장에...")
  state: StoryState; // 현재는 StoryState, Step3 이후 StoryStateV2로 확장 예정
  cast: CastStoreV2; // 캐스트 상태 스냅샷
  timestamp: number; // 저장 시각 (ms)
  lastError?: string; // 실패 시 에러 메시지 (재시도 가능 표시)
}

