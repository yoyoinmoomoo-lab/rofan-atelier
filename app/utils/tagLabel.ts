import type { Tag } from "@/app/constants/protagonistTags";
import type { LangCode } from "@/app/types";

/**
 * 태그의 언어별 라벨 반환 (UI 표시용)
 * @param tag 태그 객체
 * @param lang 현재 언어
 * @returns short_ko 또는 short_en
 */
export function getTagLabel(tag: Tag, lang: LangCode): string {
  return lang === "ko" ? tag.short_ko : tag.short_en;
}

/**
 * 태그 배열에서 ID로 태그 찾기
 * @param tagList 태그 배열
 * @param id 태그 ID
 * @returns 찾은 태그 또는 undefined
 */
export function getTagById(tagList: Tag[], id: string): Tag | undefined {
  return tagList.find((tag) => tag.id === id);
}

