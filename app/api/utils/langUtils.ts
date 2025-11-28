import { GENERATION_PROFILES } from "@/config/generationProfile";
import type { LangCode } from "@/app/types";

export function isSupportedLang(value: unknown): value is LangCode {
  return typeof value === "string" && value in GENERATION_PROFILES;
}

export function sanitizeKoreanHangul(value: string): string {
  const withoutBrackets = value.replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, "");
  const withoutLatin = withoutBrackets.replace(/[\p{Script=Latin}]/gu, "");
  const withoutDigits = withoutLatin.replace(/\d+/g, "");
  const withoutSymbols = withoutDigits.replace(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/g, "");
  return withoutSymbols.replace(/\s+/g, " ").trim();
}

