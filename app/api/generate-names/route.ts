import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  Class,
  Era,
  GenerateNamesRequest,
  Gender,
  LangCode,
  NameResult,
} from "@/app/types";
import { GENERATION_PROFILES } from "@/config/generationProfile";
import { jsonrepair } from "jsonrepair";
import { buildNamePrompt } from "./buildNamePrompt";
import { isSupportedLang, sanitizeKoreanHangul } from "../utils/langUtils";
import { NAME_MODEL } from "@/app/lib/models";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 영어 문화권 매핑 (GPT가 정확히 이해하는 형태)
const CULTURE_MAP: Record<string, string> = {
  anglo: "Anglo (England/US Western names)",
  france: "French (Western French names)",
  germanic: "Germanic/Nordic (German + Scandinavian names)",
  slavic: "Russian/Slavic (Eastern European names)",
  latin: "Spanish/Latin (Southern European names)",
  greek: "Greek (Hellenic names)",
};

const GENDER_LABELS_EN: Record<Gender, string> = {
  female: "female",
  male: "male",
  neutral: "neutral",
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
    const body: GenerateNamesRequest = await request.json();

    // 입력 검증
    if (!body.culture || !body.gender || !body.class || !body.era) {
      return NextResponse.json(
        { error: "필수 입력값이 누락되었습니다." },
        { status: 400 }
      );
    }

    const lang: LangCode = isSupportedLang(body.lang) ? body.lang : "ko";
    const profile = GENERATION_PROFILES[lang];

    const cultureEng = CULTURE_MAP[body.culture];
    const genderLabelEn = GENDER_LABELS_EN[body.gender];
    const classLabelEn = CLASS_LABELS_EN[body.class];
    const classLabelKo = CLASS_LABELS_KO[body.class];
    const eraLabelEn = ERA_LABELS_EN[body.era];

    if (!cultureEng || !genderLabelEn || !classLabelEn || !eraLabelEn) {
      return NextResponse.json(
        { error: "잘못된 입력값입니다." },
        { status: 400 }
      );
    }

    const includeNickname = Boolean(body.includeNickname);

    const prompt = buildNamePrompt({
      lang,
      cultureEng,
      genderLabelEn,
      classLabelEn,
      eraLabelEn,
      includeNickname,
      profile,
    });

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: NAME_MODEL,
        messages: [
          {
            role: "system",
            content: "You generate ONLY Western-style given names for Korean romance fantasy writers. Never output Korean-style names or titles. JSON ONLY.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
        max_tokens: 2000,
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

    // 응답 구조 검증
    if (!parsed.names || !Array.isArray(parsed.names)) {
      console.error("예상하지 못한 응답 구조:", parsed);
      throw new Error("응답 구조가 올바르지 않습니다.");
    }

    parsed.names = parsed.names.map((n: Partial<NameResult>) => {
      const koreanRaw = typeof n.korean === "string" ? n.korean : "";
      const sanitizedKorean = sanitizeKoreanHangul(koreanRaw);
      if (!sanitizedKorean && koreanRaw.trim()) {
        console.warn("korean 필드가 모두 제거됨:", { original: koreanRaw });
      }

      const name: NameResult = {
        korean: sanitizedKorean,
        roman: typeof n.roman === "string" ? n.roman : "",
        classTone:
          typeof n.classTone === "string" && n.classTone.trim()
            ? n.classTone
            : profile.classToneFallback(classLabelEn, classLabelKo),
        nicknameRoman:
          includeNickname && typeof n.nicknameRoman === "string" ? n.nicknameRoman : "",
        nicknameKorean:
          includeNickname && typeof n.nicknameKorean === "string" ? n.nicknameKorean : "",
        desc: typeof n.desc === "string" ? n.desc : "",
      };

      if (!name.korean || !name.roman) {
        console.warn("필수 필드 누락된 이름:", name);
      }

      return name;
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error generating names:", error);
    const errorMessage = error instanceof Error ? error.message : "이름 생성에 실패했습니다.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

