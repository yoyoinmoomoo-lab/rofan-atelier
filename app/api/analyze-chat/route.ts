import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { AnalyzeChatRequest, AnalyzeChatResponse, StoryState, CharacterMoodState, MoodLabel } from "@/app/types";
import { jsonrepair } from "jsonrepair";
import { ANALYZE_MODEL } from "@/app/lib/models";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CORS 헤더 설정 (Chrome Extension 호출 대비)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// OPTIONS 핸들러 (preflight 요청 처리)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// 최대 채팅 텍스트 길이 제한
const MAX_CHAT_LENGTH = 50000; // 5만 자 제한

export async function POST(request: NextRequest) {
  console.log("[AnalyzeChat] Using model:", ANALYZE_MODEL);
  try {
    // Request body 파싱
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[AnalyzeChat] Request body 파싱 실패:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 입력 검증
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const requestBody = body as Record<string, unknown>;
    const chatText: string | undefined = typeof requestBody.chatText === "string" ? requestBody.chatText : undefined;
    const previousState: StoryState | null | undefined = requestBody.previousState ? (requestBody.previousState as StoryState) : null;

    if (!chatText || typeof chatText !== "string") {
      return NextResponse.json(
        { error: "chatText is required and must be a string" },
        { status: 400, headers: corsHeaders }
      );
    }

    const trimmedChatText = chatText.trim();

    if (trimmedChatText.length === 0) {
      return NextResponse.json(
        { error: "chatText cannot be empty" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (trimmedChatText.length > MAX_CHAT_LENGTH) {
      return NextResponse.json(
        { error: `chatText is too long (max ${MAX_CHAT_LENGTH} characters)` },
        { status: 400, headers: corsHeaders }
      );
    }

    // 로깅 추가
    console.log(
      "[analyze-chat] Request received",
      "textLength=",
      trimmedChatText.length,
      "hasPreviousState=",
      !!previousState
    );

    // previousState 로깅
    if (previousState) {
      console.log("[AnalyzeChat] Previous state provided:", {
        scene: previousState.scene,
        characterCount: previousState.characters.length,
      });
    }

    // 프롬프트 구성
    const systemPrompt = `너는 로맨스 판타지 소설의 '무대 감독'이야. 주어진 대화/텍스트를 분석해서 등장인물, 감정, 분위기, 관계를 JSON 형식으로 추출해줘.

반드시 다음 JSON 구조를 정확히 따라야 해:

{
  "scene": {
    "summary": "장면의 한 줄 요약 (예: '왕궁의 연회장에서 주인공과 남주가 첫 만남')",
    "type": "castle" | "room" | "garden" | "hall" | "carriage" | "forest",
    "location_name": "구체적인 장소 이름 (예: '왕궁 연회장', '서재', '정원의 장미꽃길')",
    "backdrop_style": "배경 스타일 설명 (예: '화려한 샹들리에가 달린', '어두운 촛불이 켜진', '햇살이 가득한')"
  },
  "characters": [
    {
      "name": "캐릭터 이름",
      "slot": "left" | "center" | "right",
      "moodState": {
        "label": "joy" | "tension" | "anger" | "sadness" | "fear" | "surprise" | "neutral" | "love" | "contempt",
        "description": "캐릭터의 현재 감정 상태에 대한 간단한 설명 (1-2문장)"
      }
    }
  ],
  "relations": [
    {
      "a": "캐릭터 A 이름",
      "b": "캐릭터 B 이름",
      "tension": 0~100 숫자,
      "affection": 0~100 숫자
    }
  ],
  "dialogue_impact": "low" | "medium" | "high"
}

규칙:
- scene.type은 장면의 배경을 나타내는 타입 중 하나여야 해
- scene.location_name은 구체적이고 생생한 장소 이름을 제공해 (예: '왕궁 연회장', '서재', '정원의 장미꽃길')
- scene.backdrop_style은 배경의 분위기나 스타일을 묘사하는 짧은 문구여야 해 (예: '화려한 샹들리에가 달린', '어두운 촛불이 켜진')
- characters 배열에는 등장하는 주요 인물들을 최대 3명까지 포함 (slot: left, center, right)
- characters 각 항목의 moodState.label은 다음 중 하나여야 해:
  * "joy": 기쁨, 행복, 즐거움
  * "tension": 긴장, 불안, 경계
  * "anger": 분노, 화남, 격분
  * "sadness": 슬픔, 우울, 절망
  * "fear": 두려움, 공포, 불안
  * "surprise": 놀람, 경악, 충격
  * "neutral": 평온, 무감정, 차분
  * "love": 사랑, 애정, 호감
  * "contempt": 경멸, 멸시, 냉소
- moodState.description은 캐릭터의 현재 감정 상태를 1-2문장으로 설명해 (예: '그녀는 그의 말에 당황하며 눈을 크게 떴다', '그는 차갑게 그녀를 바라보고 있었다')
- relations 배열에는 캐릭터 간 관계가 있을 때만 포함 (없으면 빈 배열)
- tension과 affection은 0~100 사이의 정수
- dialogue_impact는 대화의 감정적 강도에 따라 결정

JSON만 반환하고, 다른 설명은 하지 마.`;

    // previousState 유무에 따라 안내 문구 다르게
    const previousStateBlock = previousState
      ? `\n\n현재까지 알고 있는 세계 상태(StoryState JSON):\n${JSON.stringify(
          previousState,
          null,
          2
        )}\n\n위 상태를 기반으로 아래 새 텍스트를 반영해서 '업데이트된' StoryState를 만들어줘.

중요한 업데이트 규칙:
- 언급되지 않은 캐릭터/배경/관계는 그대로 유지해
- 장소가 바뀌면 scene.location_name과 scene.backdrop_style을 새로 업데이트해
- 캐릭터의 감정이 바뀌면 moodState.label과 moodState.description을 새 텍스트에 맞게 업데이트해
- 이름이나 역할이 바뀌면 그 부분만 수정해
- 새로운 캐릭터가 등장하면 characters 배열에 추가해
- 기존 캐릭터가 사라지면 characters 배열에서 제거해`
      : `\n\n이번 텍스트를 바탕으로 새로운 StoryState를 처음부터 만들어줘.`;

    const userPrompt = `분석할 소설 텍스트:\n"""${trimmedChatText}"""\n${previousStateBlock}

반드시 아래 StoryState 타입에 맞는 JSON만 반환해:

{
  "scene": {
    "summary": "장면의 한 줄 요약",
    "type": "castle" | "room" | "garden" | "hall" | "carriage" | "forest",
    "location_name": "구체적인 장소 이름",
    "backdrop_style": "배경 스타일 설명"
  },
  "characters": [
    {
      "name": "캐릭터 이름",
      "slot": "left" | "center" | "right",
      "moodState": {
        "label": "joy" | "tension" | "anger" | "sadness" | "fear" | "surprise" | "neutral" | "love" | "contempt",
        "description": "감정 상태 설명 (1-2문장)"
      }
    }
  ],
  "relations": [],
  "dialogue_impact": "low" | "medium" | "high"
}`;

    // OpenAI 호출 및 파싱 함수
    const callOpenAIAndParse = async (attempt: number): Promise<StoryState> => {
      const startTime = Date.now();
      console.log(`[AnalyzeChat] Attempt ${attempt} started...`);

      // OpenAI API 호출
      let completion;
      try {
        const apiStartTime = Date.now();
        completion = await openai.chat.completions.create({
          model: ANALYZE_MODEL,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 3000, // v0.2: 새로운 필드 추가로 토큰 수 증가
        });
        const apiDuration = Date.now() - apiStartTime;
        console.log(`[AnalyzeChat] Attempt ${attempt} - OpenAI API call: ${apiDuration}ms`);
      } catch (apiError: unknown) {
        const apiDuration = Date.now() - startTime;
        console.error(`[AnalyzeChat] Attempt ${attempt} - OpenAI API 에러 (${apiDuration}ms):`, apiError);
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

        console.error(`[AnalyzeChat] Attempt ${attempt} - OpenAI API 오류 (status: ${status}): ${message}`);
        throw new Error("OPENAI_ERROR");
      }

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        const duration = Date.now() - startTime;
        console.error(`[AnalyzeChat] Attempt ${attempt} - OpenAI 응답이 비어있음 (${duration}ms):`, completion);
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
        console.log(`[AnalyzeChat] Attempt ${attempt} - JSON 파싱 성공: ${parseDuration}ms`);
        if (attempt === 1) {
          console.log("parsedJson:", JSON.stringify(parsed, null, 2));
        }
      } catch (parseError) {
        const parseDuration = Date.now() - parseStartTime;
        console.error(`[AnalyzeChat] Attempt ${attempt} - JSON 파싱 실패 (${parseDuration}ms):`, parseError);
        if (attempt === 1) {
          console.error("응답 내용:", content);
        }
        throw new Error("PARSE_ERROR");
      }

      // StoryState 구조 검증 및 변환
      if (typeof parsed !== "object" || parsed === null) {
        const duration = Date.now() - startTime;
        console.error(`[AnalyzeChat] Attempt ${attempt} - 응답 타입 오류: ${typeof parsed} (${duration}ms)`);
        throw new Error("INVALID_TYPE");
      }

      const obj = parsed as Record<string, unknown>;

      // scene 검증
      if (!obj.scene || typeof obj.scene !== "object") {
        throw new Error("INVALID_SCENE");
      }
      const scene = obj.scene as Record<string, unknown>;
      if (
        typeof scene.summary !== "string" ||
        typeof scene.type !== "string" ||
        !["castle", "room", "garden", "hall", "carriage", "forest"].includes(scene.type)
      ) {
        throw new Error("INVALID_SCENE_FIELDS");
      }
      
      // scene의 선택적 필드 파싱
      const location_name = typeof scene.location_name === "string" ? scene.location_name : undefined;
      const backdrop_style = typeof scene.backdrop_style === "string" ? scene.backdrop_style : undefined;

      // characters 검증
      if (!Array.isArray(obj.characters)) {
        throw new Error("INVALID_CHARACTERS");
      }
      const characters = obj.characters.map((char: unknown) => {
        if (typeof char !== "object" || char === null) {
          throw new Error("INVALID_CHARACTER_ITEM");
        }
        const c = char as Record<string, unknown>;
        if (
          typeof c.name !== "string" ||
          typeof c.slot !== "string" ||
          !["left", "center", "right"].includes(c.slot)
        ) {
          throw new Error("INVALID_CHARACTER_FIELDS");
        }
        
        // moodState 파싱 (선택적)
        let moodState: CharacterMoodState | undefined = undefined;
        if (c.moodState && typeof c.moodState === "object" && c.moodState !== null) {
          const moodStateObj = c.moodState as Record<string, unknown>;
          const validLabels: MoodLabel[] = ["joy", "tension", "anger", "sadness", "fear", "surprise", "neutral", "love", "contempt"];
          if (
            typeof moodStateObj.label === "string" &&
            validLabels.includes(moodStateObj.label as MoodLabel) &&
            typeof moodStateObj.description === "string"
          ) {
            moodState = {
              label: moodStateObj.label as MoodLabel,
              description: moodStateObj.description,
            };
          }
        }
        
        return {
          name: c.name,
          slot: c.slot as "left" | "center" | "right",
          moodState: moodState,
        };
      });

      // relations 검증
      if (!Array.isArray(obj.relations)) {
        throw new Error("INVALID_RELATIONS");
      }
      const relations = obj.relations.map((rel: unknown) => {
        if (typeof rel !== "object" || rel === null) {
          throw new Error("INVALID_RELATION_ITEM");
        }
        const r = rel as Record<string, unknown>;
        if (
          typeof r.a !== "string" ||
          typeof r.b !== "string" ||
          typeof r.tension !== "number" ||
          typeof r.affection !== "number" ||
          r.tension < 0 ||
          r.tension > 100 ||
          r.affection < 0 ||
          r.affection > 100
        ) {
          throw new Error("INVALID_RELATION_FIELDS");
        }
        return {
          a: r.a,
          b: r.b,
          tension: Math.round(r.tension),
          affection: Math.round(r.affection),
        };
      });

      // dialogue_impact 검증
      if (
        typeof obj.dialogue_impact !== "string" ||
        !["low", "medium", "high"].includes(obj.dialogue_impact)
      ) {
        throw new Error("INVALID_DIALOGUE_IMPACT");
      }

      const state: StoryState = {
        scene: {
          summary: scene.summary,
          type: scene.type as "castle" | "room" | "garden" | "hall" | "carriage" | "forest",
          location_name: location_name,
          backdrop_style: backdrop_style,
        },
        characters: characters,
        relations: [], // relations는 항상 빈 배열
        dialogue_impact: obj.dialogue_impact as "low" | "medium" | "high",
      };

      const totalDuration = Date.now() - startTime;
      console.log(`[AnalyzeChat] Attempt ${attempt} - 완료: ${totalDuration}ms`);
      return state;
    };

    // 첫 번째 시도
    let state: StoryState;
    try {
      state = await callOpenAIAndParse(1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "UNKNOWN";

      // OpenAI API 오류나 빈 응답은 재시도하지 않음
      if (errorMessage === "OPENAI_ERROR" || errorMessage === "EMPTY_RESPONSE") {
        return NextResponse.json(
          { error: errorMessage === "OPENAI_ERROR" ? "OpenAI API error" : "Empty response from OpenAI" },
          { status: 500, headers: corsHeaders }
        );
      }

      // 파싱/구조 오류는 재시도
      console.log(`[AnalyzeChat] 1st attempt failed (${errorMessage}), retrying...`);
      const retryStartTime = Date.now();
      try {
        state = await callOpenAIAndParse(2);
        const retryDuration = Date.now() - retryStartTime;
        console.log(`[AnalyzeChat] 재시도 성공 (재시도 소요: ${retryDuration}ms)`);
      } catch (retryError) {
        const retryErrorMsg = retryError instanceof Error ? retryError.message : "UNKNOWN";
        const retryDuration = Date.now() - retryStartTime;
        console.error(`[AnalyzeChat] 2nd attempt also failed (${retryErrorMsg}, 재시도 소요: ${retryDuration}ms)`);
        console.error(`[AnalyzeChat] 재시도 에러 상세:`, retryError);
        return NextResponse.json(
          { error: "PARSE_FAILED" },
          { status: 200, headers: corsHeaders }
        );
      }
    }

    const response: AnalyzeChatResponse = { state };
    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error("[AnalyzeChat] API error:", error);
    console.error("[AnalyzeChat] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}


