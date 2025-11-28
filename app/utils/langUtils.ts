import type { LangCode } from "@/app/types";
import { GENERATION_PROFILES } from "@/config/generationProfile";

export function isSupportedLang(value: unknown): value is LangCode {
  return typeof value === "string" && value in GENERATION_PROFILES;
}

export function getInitialLang(
  urlLang: string | null,
  storageLang: string | null
): LangCode {
  if (isSupportedLang(urlLang)) {
    return urlLang;
  }
  if (isSupportedLang(storageLang)) {
    return storageLang;
  }
  return "ko";
}

