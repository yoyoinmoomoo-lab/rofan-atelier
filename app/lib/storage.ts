/**
 * Storage v2 매니저
 * 
 * Phase2: CastStore v2 및 LastSuccessRecord 저장/로드 관리
 * Extension과 iframe 모두에서 사용 가능한 공통 유틸
 */

import type {
  CastStoreV2,
  BackstageCastEntryV2,
  BackstageCastStateV1,
  BackstageCastEntryV1,
  LastSuccessRecord,
  StoryState,
} from "@/app/types";

// ============================================================================
// 상수
// ============================================================================

const CAST_KEY_PREFIX = "vivid-chat-cast::";
const LAST_SUCCESS_KEY_PREFIX = "vivid-chat-last-success::";

// ============================================================================
// UUID 생성
// ============================================================================

/**
 * UUID 생성 (crypto.randomUUID() 사용)
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback (비권장, 충돌 가능)
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Alias 정규화
// ============================================================================

/**
 * Alias 정규화 (Step1: 최소 규칙만)
 * - trim
 * - 소문자화 (영문)
 * - 연속 공백 → 단일 공백
 * - 특수문자 제거 ❌ (하지 않음)
 */
export function normalizeAlias(alias: string): string {
  return alias
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " "); // 연속 공백 → 단일 공백
}

// ============================================================================
// CastStore v2 저장/로드
// ============================================================================

/**
 * CastStore v2 저장
 */
export function saveCastStore(scenarioKey: string, castStore: CastStoreV2): void {
  if (typeof window === "undefined") return;

  const key = `${CAST_KEY_PREFIX}${scenarioKey}`;
  try {
    window.localStorage.setItem(key, JSON.stringify(castStore));
  } catch (e) {
    console.warn("[Storage] Failed to save cast store:", e);
  }
}

/**
 * CastStore v2 로드
 * v1 데이터가 있으면 자동으로 v2로 마이그레이션
 */
export function loadCastStore(scenarioKey: string): CastStoreV2 | null {
  if (typeof window === "undefined") return null;

  const key = `${CAST_KEY_PREFIX}${scenarioKey}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // v2 형식인지 확인
    if (parsed && typeof parsed === "object" && parsed.version === "v2") {
      return parsed as CastStoreV2;
    }

    // v1 형식이면 마이그레이션
    if (Array.isArray(parsed)) {
      console.log("[Storage] Migrating cast from v1 to v2");
      const v1Data = parsed as BackstageCastStateV1;
      const v2Data = migrateCastV1ToV2(v1Data);
      saveCastStore(scenarioKey, v2Data);
      return v2Data;
    }

    // 알 수 없는 형식
    console.warn("[Storage] Unknown cast store format, creating empty v2");
    return createEmptyCastStore();
  } catch (e) {
    console.warn("[Storage] Failed to load cast store:", e);
    return null;
  }
}

/**
 * 빈 CastStore v2 생성
 */
export function createEmptyCastStore(): CastStoreV2 {
  return {
    version: "v2",
    charactersById: {},
    aliasMap: {},
  };
}

/**
 * v1 → v2 마이그레이션
 */
function migrateCastV1ToV2(v1Data: BackstageCastStateV1): CastStoreV2 {
  const charactersById: Record<string, BackstageCastEntryV2> = {};
  const aliasMap: Record<string, string> = {};

  v1Data.forEach((entry) => {
    const id = generateUUID();
    const normalizedName = normalizeAlias(entry.name);

    const v2Entry: BackstageCastEntryV2 = {
      id,
      canonicalName: entry.name,
      aliases: [entry.name], // 기본값: canonicalName만
      gender: entry.gender,
      isGhost: false,
    };

    charactersById[id] = v2Entry;
    aliasMap[normalizedName] = id;
  });

  return {
    version: "v2",
    charactersById,
    aliasMap,
  };
}

// ============================================================================
// CastStore v2 유틸리티
// ============================================================================

/**
 * CastStore v2에서 캐릭터 배열로 변환 (렌더링용)
 */
export function castStoreToArray(castStore: CastStoreV2): BackstageCastEntryV2[] {
  return Object.values(castStore.charactersById);
}

/**
 * 캐릭터 배열에서 CastStore v2로 변환
 */
export function arrayToCastStore(entries: BackstageCastEntryV2[]): CastStoreV2 {
  const charactersById: Record<string, BackstageCastEntryV2> = {};
  const aliasMap: Record<string, string> = {};

  entries.forEach((entry) => {
    charactersById[entry.id] = entry;
    // 모든 aliases를 aliasMap에 등록
    entry.aliases.forEach((alias) => {
      const normalized = normalizeAlias(alias);
      aliasMap[normalized] = entry.id;
    });
  });

  return {
    version: "v2",
    charactersById,
    aliasMap,
  };
}

/**
 * alias로 캐릭터 찾기
 */
export function findCharacterByAlias(
  castStore: CastStoreV2,
  alias: string
): BackstageCastEntryV2 | null {
  const normalized = normalizeAlias(alias);
  const id = castStore.aliasMap[normalized];
  if (!id) return null;
  return castStore.charactersById[id] || null;
}

// ============================================================================
// LastSuccessRecord 저장/로드
// ============================================================================

/**
 * LastSuccessRecord 저장
 */
export function saveLastSuccessRecord(
  scenarioKey: string,
  record: LastSuccessRecord
): void {
  if (typeof window === "undefined") return;

  const key = `${LAST_SUCCESS_KEY_PREFIX}${scenarioKey}`;
  try {
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch (e) {
    console.warn("[Storage] Failed to save last success record:", e);
  }
}

/**
 * LastSuccessRecord 로드
 */
export function loadLastSuccessRecord(scenarioKey: string): LastSuccessRecord | null {
  if (typeof window === "undefined") return null;

  const key = `${LAST_SUCCESS_KEY_PREFIX}${scenarioKey}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as LastSuccessRecord;
  } catch (e) {
    console.warn("[Storage] Failed to load last success record:", e);
    return null;
  }
}

/**
 * LastSuccessRecord 삭제
 */
export function deleteLastSuccessRecord(scenarioKey: string): void {
  if (typeof window === "undefined") return;

  const key = `${LAST_SUCCESS_KEY_PREFIX}${scenarioKey}`;
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    console.warn("[Storage] Failed to delete last success record:", e);
  }
}

// ============================================================================
// TurnId 계산 (Step2에서 사용 예정)
// ============================================================================

/**
 * TurnId 계산 (textHash 기반)
 */
export function calculateTurnId(text: string, messageId?: string | null): string {
  if (messageId) {
    return messageId;
  }
  // textHash: 길이 + 첫 50자
  const trimmed = text.trim();
  return `${trimmed.length}:${trimmed.slice(0, 50)}`;
}

