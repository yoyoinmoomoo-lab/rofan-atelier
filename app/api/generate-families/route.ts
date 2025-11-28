import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  Class,
  Era,
  FamilyResult,
  GenerateFamiliesRequest,
  LangCode,
} from "@/app/types";
import { GENERATION_PROFILES } from "@/config/generationProfile";
import { jsonrepair } from "jsonrepair";
import { buildFamilyPrompt } from "./buildFamilyPrompt";
import { isSupportedLang, sanitizeKoreanHangul } from "../utils/langUtils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 문화권 English 설명
const CULTURE_MAP: Record<string, string> = {
  anglo: "Anglo (England/US Western names)",
  france: "French (Western French names)",
  germanic: "Germanic/Nordic (German + Scandinavian names)",
  slavic: "Russian/Slavic (Eastern European names)",
  latin: "Spanish/Latin (Southern European names)",
  greek: "Greek (Hellenic names)",
};

const CLASS_LABELS_EN: Record<Class, string> = {
  royal: "royal",
  noble: "noble",
  commoner: "commoner",
};

const CLASS_LABELS_KO: Record<Class, string> = {
  royal: "왕족",
  noble: "귀족",
  commoner: "서민",
};

const ERA_LABELS_EN: Record<Era, string> = {
  medieval: "medieval style",
  romantic: "romantic-era style",
  modern19: "19th-century style",
};

export async function POST(request: NextRequest) {
  try {
    const body: GenerateFamiliesRequest = await request.json();

    if (!body.culture || !body.class || !body.era) {
      return NextResponse.json(
        { error: "필수 입력값이 누락되었습니다." },
        { status: 400 }
      );
    }

    const lang: LangCode = isSupportedLang(body.lang) ? body.lang : "ko";
    const profile = GENERATION_PROFILES[lang];

    const cultureEng = CULTURE_MAP[body.culture];
    const classLabelEn = CLASS_LABELS_EN[body.class];
    const classLabelKo = CLASS_LABELS_KO[body.class];
    const eraLabelEn = ERA_LABELS_EN[body.era];

    if (!cultureEng || !classLabelEn || !eraLabelEn) {
      return NextResponse.json(
        { error: "잘못된 입력값입니다." },
        { status: 400 }
      );
    }

    const prompt = buildFamilyPrompt({
      lang,
      cultureEng,
      classLabelEn,
      eraLabelEn,
      profile,
    });

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You generate ONLY Western-style family names for Korean romance fantasy writers. Never output Korean-style family names. JSON ONLY.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });
    } catch (apiError: unknown) {
      console.error("OpenAI API 에러:", apiError);
      const status =
        typeof apiError === "object" && apiError !== null && "status" in apiError
          ? (apiError as { status?: number }).status
          : undefined;
      const message =
        typeof apiError === "object" && apiError !== null && "message" in apiError
          ? String((apiError as { message?: string }).message)
          : "알 수 없는 오류";

      if (status === 401) {
        throw new Error("OpenAI API 키가 유효하지 않습니다.");
      } else if (status === 429) {
        throw new Error("API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.");
      } else if (status === 500) {
        throw new Error("OpenAI 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
      throw new Error(`OpenAI API 호출 실패: ${message}`);
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error("OpenAI 응답이 비어있음:", completion);
      throw new Error("OpenAI로부터 응답을 받지 못했습니다.");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonrepair(content));
    } catch (parseError) {
      console.error("JSON 파싱 에러:", parseError);
      console.error("응답 내용:", content);
      throw new Error("응답 형식이 올바르지 않습니다.");
    }

    if (!parsed.families || !Array.isArray(parsed.families)) {
      console.error("예상하지 못한 응답 구조:", parsed);
      throw new Error("응답 구조가 올바르지 않습니다.");
    }

    parsed.families = parsed.families.map((f: Partial<FamilyResult>) => {
      const koreanRaw = typeof f.korean === "string" ? f.korean : "";
      const sanitizedKorean = sanitizeKoreanHangul(koreanRaw);
      if (!sanitizedKorean && koreanRaw.trim()) {
        console.warn("korean 가문명이 모두 제거됨:", { original: koreanRaw });
      }

      const family: FamilyResult = {
        korean: sanitizedKorean,
        roman: typeof f.roman === "string" ? f.roman : "",
        tone:
          typeof f.tone === "string" && f.tone.trim()
            ? f.tone
            : profile.classToneFallback(classLabelEn, classLabelKo),
        keywords: Array.isArray(f.keywords)
          ? f.keywords.filter((keyword): keyword is string => typeof keyword === "string")
          : [],
        desc: typeof f.desc === "string" ? f.desc : "",
      };

      if (!family.korean || !family.roman) {
        console.warn("필수 필드 누락된 가문명:", family);
      }

      return family;
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error generating families:", error);
    const errorMessage = error instanceof Error ? error.message : "가문명 생성에 실패했습니다.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

