import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  GenerateCharacterNamesRequest,
  CharacterNameResult,
  LangCode,
} from "@/app/types";
import { buildCharacterPrompt } from "./buildCharacterPrompt";
import { jsonrepair } from "jsonrepair";
import { isSupportedLang } from "../utils/langUtils";
import { CHARACTER_MODEL } from "@/app/lib/models";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log("[CharacterName] Using model:", CHARACTER_MODEL);
  try {
    // Request body 파싱
    let body: GenerateCharacterNamesRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[CharacterName] Request body 파싱 실패:", parseError);
      return NextResponse.json(
        { errorKey: "error_server" },
        { status: 400 }
      );
    }

    // 입력 검증
    // 1. tone_strength 검증 (1~5)
    if (typeof body.tone_strength !== "number" || body.tone_strength < 1 || body.tone_strength > 5) {
      return NextResponse.json(
        { errorKey: "error_server" },
        { status: 400 }
      );
    }

    // 2. eraLevel 검증 (1~5)
    if (typeof body.eraLevel !== "number" || body.eraLevel < 1 || body.eraLevel > 5) {
      console.error("[CharacterName] invalid eraLevel:", body.eraLevel);
      return NextResponse.json(
        { errorKey: "error_server" },
        { status: 400 }
      );
    }

    // 3. characterPrompt 자동 slice 처리 (80자 초과 시 경고만)
    const characterPrompt = (body.characterPrompt || "").slice(0, 80);
    if (body.characterPrompt && body.characterPrompt.length > 80) {
      console.warn(
        `characterPrompt가 80자를 초과하여 자동으로 잘렸습니다: ${body.characterPrompt.length}자 → 80자`
      );
    }

    // 4. lang 기본값 설정
    const lang: LangCode = isSupportedLang(body.lang) ? body.lang : "ko";

    // 프롬프트 빌드
    let system: string;
    let user: string;
    try {
      const promptResult = buildCharacterPrompt({
        gender: body.gender,
        tone_strength: body.tone_strength,
        eraLevel: body.eraLevel,
        characterPrompt: characterPrompt,
        lang,
      });
      system = promptResult.system;
      user = promptResult.user;
      console.log("[CharacterName] System prompt length:", system.length);
    } catch (promptError) {
      console.error("[CharacterName] 프롬프트 빌드 실패:", promptError);
      console.error("[CharacterName] 입력 데이터:", JSON.stringify(body, null, 2));
      return NextResponse.json(
        { errorKey: "error_server" },
        { status: 500 }
      );
    }

    // OpenAI 호출 및 파싱 함수
    const callOpenAIAndParse = async (attempt: number): Promise<CharacterNameResult[]> => {
      const startTime = Date.now();
      console.log(`[CharacterName] Attempt ${attempt} started...`);

      // OpenAI API 호출
      let completion;
      try {
        const apiStartTime = Date.now();
        completion = await openai.chat.completions.create({
          model: CHARACTER_MODEL,
          messages: [
            {
              role: "system",
              content: system,
            },
            {
              role: "user",
              content: user,
            },
          ],
          temperature: 0.6,
          max_tokens: 2000,
        });
        const apiDuration = Date.now() - apiStartTime;
        console.log(`[CharacterName] Attempt ${attempt} - OpenAI API call: ${apiDuration}ms`);
      } catch (apiError: unknown) {
        const apiDuration = Date.now() - startTime;
        console.error(`[CharacterName] Attempt ${attempt} - OpenAI API 에러 (${apiDuration}ms):`, apiError);
        const status =
          typeof apiError === "object" &&
          apiError !== null &&
          "status" in apiError
            ? (apiError as { status?: number }).status
            : undefined;
        const message =
          typeof apiError === "object" &&
          apiError !== null &&
          "message" in apiError
            ? String((apiError as { message?: string }).message)
            : "알 수 없는 오류";

        // 모든 OpenAI 관련 에러는 error_openai로 통일
        console.error(`[CharacterName] Attempt ${attempt} - OpenAI API 오류 (status: ${status}): ${message}`);
        throw new Error("OPENAI_ERROR");
      }

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        const duration = Date.now() - startTime;
        console.error(`[CharacterName] Attempt ${attempt} - OpenAI 응답이 비어있음 (${duration}ms):`, completion);
        throw new Error("EMPTY_RESPONSE");
      }

      // 로깅: 원본 응답
      if (attempt === 1) {
        console.log("=== OpenAI 응답 원본 ===");
        console.log("rawText:", content);
        console.log("rawText length:", content.length);
      }

      // JSON 파싱
      const parseStartTime = Date.now();
      let repaired: string;
      let parsed: unknown;
      try {
        // jsonrepair로 JSON 복구 시도
        repaired = jsonrepair(content);
        if (attempt === 1) {
          console.log("repairedText:", repaired);
        }
        parsed = JSON.parse(repaired);
        const parseDuration = Date.now() - parseStartTime;
        console.log(`[CharacterName] Attempt ${attempt} - JSON 파싱 성공: ${parseDuration}ms`);
        if (attempt === 1) {
          console.log("parsedJson:", JSON.stringify(parsed, null, 2));
        }
      } catch (parseError) {
        const parseDuration = Date.now() - parseStartTime;
        console.error(`[CharacterName] Attempt ${attempt} - JSON 파싱 실패 (${parseDuration}ms):`, parseError);
        if (attempt === 1) {
          console.error("응답 내용:", content);
        }
        throw new Error("PARSE_ERROR");
      }

      // 응답 구조 검증 및 변환
      let namesArray: unknown[] = [];

      if (Array.isArray(parsed)) {
        console.log(`[CharacterName] Attempt ${attempt} - 응답 형태: 순수 배열`);
        namesArray = parsed;
      } else if (typeof parsed === "object" && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        
        if (Array.isArray(obj.names)) {
          console.log(`[CharacterName] Attempt ${attempt} - 응답 형태: { names: [...] }`);
          namesArray = obj.names;
        } else if (Array.isArray(obj.data)) {
          console.log(`[CharacterName] Attempt ${attempt} - 응답 형태: { data: [...] }`);
          namesArray = obj.data;
        } else if (Array.isArray(obj.results)) {
          console.log(`[CharacterName] Attempt ${attempt} - 응답 형태: { results: [...] }`);
          namesArray = obj.results;
        } else {
          const arrayValues = Object.values(obj).filter(Array.isArray);
          if (arrayValues.length > 0) {
            console.log(`[CharacterName] Attempt ${attempt} - 응답 형태: 객체 내 배열 발견`);
            namesArray = arrayValues[0] as unknown[];
          } else {
            const duration = Date.now() - startTime;
            console.error(`[CharacterName] Attempt ${attempt} - 응답 구조 오류: 배열 없음 (${duration}ms)`);
            console.error(`[CharacterName] Attempt ${attempt} - 객체 키들:`, Object.keys(obj));
            throw new Error("INVALID_STRUCTURE");
          }
        }
      } else {
        const duration = Date.now() - startTime;
        console.error(`[CharacterName] Attempt ${attempt} - 응답 타입 오류: ${typeof parsed} (${duration}ms)`);
        throw new Error("INVALID_TYPE");
      }

      console.log(`[CharacterName] Attempt ${attempt} - namesArray length:`, namesArray.length);

      // CharacterNameResult[]로 변환
      const conversionStartTime = Date.now();
      const names: CharacterNameResult[] = namesArray
        .map((item: unknown, index: number) => {
          if (typeof item !== "object" || item === null) {
            console.warn(`[CharacterName] Attempt ${attempt} - 항목 ${index}이 객체가 아님:`, item);
            return null;
          }

          const obj = item as Record<string, unknown>;
          
          const nameKor =
            typeof obj.name_kor === "string"
              ? obj.name_kor
              : typeof obj.nameKor === "string"
              ? obj.nameKor
              : typeof obj.name_korean === "string"
              ? obj.name_korean
              : typeof obj.korean === "string"
              ? obj.korean
              : "";

          const nameRom =
            typeof obj.name_rom === "string"
              ? obj.name_rom
              : typeof obj.nameRom === "string"
              ? obj.nameRom
              : typeof obj.name_roman === "string"
              ? obj.name_roman
              : typeof obj.roman === "string"
              ? obj.roman
              : "";

          const desc =
            typeof obj.desc === "string"
              ? obj.desc
              : typeof obj.description === "string"
              ? obj.description
              : "";

          if (!nameKor && !nameRom) {
            console.warn(`[CharacterName] Attempt ${attempt} - 항목 ${index}에 이름이 없음:`, obj);
            return null;
          }

          // desc 필드 validation 강화
          if (!desc || typeof desc !== "string" || desc.trim() === "") {
            console.warn(`[CharacterName] Attempt ${attempt} - 항목 ${index}에 desc가 없거나 비어있음:`, obj);
            return null;
          }

          return {
            name_kor: nameKor,
            name_rom: nameRom,
            desc: desc.trim(),
          } as CharacterNameResult;
        })
        .filter((name): name is CharacterNameResult => name !== null);

      const conversionDuration = Date.now() - conversionStartTime;
      const totalDuration = Date.now() - startTime;
      console.log(`[CharacterName] Attempt ${attempt} - 유효한 이름 ${names.length}개 추출됨 (전체 ${namesArray.length}개 중, 변환: ${conversionDuration}ms)`);

      if (names.length === 0) {
        console.error(`[CharacterName] Attempt ${attempt} - 유효한 이름이 생성되지 않음 (${totalDuration}ms)`);
        console.error(`[CharacterName] Attempt ${attempt} - 실패 지점: 유효 항목 0개`);
        throw new Error("NO_VALID_NAMES");
      }

      console.log(`[CharacterName] Attempt ${attempt} - 완료: ${totalDuration}ms`);
      return names;
    };

    // 첫 번째 시도
    let names: CharacterNameResult[];
    try {
      names = await callOpenAIAndParse(1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "UNKNOWN";
      
      // OpenAI API 오류나 빈 응답은 재시도하지 않음
      if (errorMessage === "OPENAI_ERROR" || errorMessage === "EMPTY_RESPONSE") {
        return NextResponse.json(
          { errorKey: errorMessage === "OPENAI_ERROR" ? "error_openai" : "error_invalid_response" },
          { status: 500 }
        );
      }

      // 파싱/구조 오류는 재시도
      console.log(`[CharacterName] 1st attempt failed (${errorMessage}), retrying...`);
      const retryStartTime = Date.now();
      try {
        names = await callOpenAIAndParse(2);
        const retryDuration = Date.now() - retryStartTime;
        console.log(`[CharacterName] 재시도 성공 (재시도 소요: ${retryDuration}ms)`);
      } catch (retryError) {
        const retryErrorMsg = retryError instanceof Error ? retryError.message : "UNKNOWN";
        const retryDuration = Date.now() - retryStartTime;
        console.error(`[CharacterName] 2nd attempt also failed (${retryErrorMsg}, 재시도 소요: ${retryDuration}ms)`);
        console.error(`[CharacterName] 재시도 에러 상세:`, retryError);
        return NextResponse.json(
          { errorKey: "error_invalid_response" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ names });
  } catch (error) {
    console.error("[CharacterName] API error:", error);
    console.error("[CharacterName] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    // 예상치 못한 에러는 error_server로 처리
    return NextResponse.json(
      { errorKey: "error_server" },
      { status: 500 }
    );
  }
}

