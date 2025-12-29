import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { AnalyzeChatRequest, AnalyzeChatResponse, StoryState, StoryStateV2, Scene, CharacterMoodState, MoodLabel, CastHint } from "@/app/types";
import { jsonrepair } from "jsonrepair";
import { ANALYZE_MODEL } from "@/app/lib/models";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 하드코딩 제거: botContext가 동적으로 주입됨

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

/**
 * Step3.1: 인접 중복 scene 병합 함수
 * 같은 location_name을 가진 인접한 scene들을 하나로 병합
 */
function mergeAdjacentDuplicateScenes(scenes: Scene[]): Scene[] {
  if (scenes.length <= 1) return scenes;
  
  // location_name 정규화 (trim + 공백 정리 필수, lowercase는 optional)
  const normalized = (name: string | undefined): string => {
    if (!name) return '';
    return name.trim().replace(/\s+/g, ' ').toLowerCase(); // lowercase는 있어도 무방
  };
  
  // summary 정규화 (동일 여부 판단용)
  const normalizeSummary = (s: string): string => {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
  };
  
  const merged: Scene[] = [];
  let i = 0;
  
  while (i < scenes.length) {
    let current = scenes[i];
    let j = i + 1;
    
    // 현재 scene의 location_name 정규화
    const currentLoc = normalized(current.location_name);
    
    // 빈 값/공백이면 병합하지 않음 (안전장치)
    if (!currentLoc || currentLoc.trim() === '') {
      merged.push(current);
      i++;
      continue;
    }
    
    // 인접한 같은 location_name 찾기
    while (j < scenes.length) {
      const next = scenes[j];
      const nextLoc = normalized(next.location_name);
      
      // 빈 값/공백이면 병합 중단
      if (!nextLoc || nextLoc.trim() === '') {
        break;
      }
      
      // 같은 location_name이면 병합
      if (currentLoc === nextLoc) {
        // 병합: characters 합치기 (name 기준 Map으로 merge, 정보 손실 방지)
        const charMap = new Map<string, typeof current.characters[0]>();
        
        // current.characters 먼저 추가
        for (const char of current.characters) {
          charMap.set(char.name, { ...char });
        }
        
        // next.characters와 merge (동일 name이면 필드별로 더 풍부한 정보 선택)
        for (const nextChar of next.characters) {
          const existing = charMap.get(nextChar.name);
          if (existing) {
            // 동일 name이면 필드별 merge
            const mergedChar = {
              ...existing,
              // slot: non-null 우선 (기존 것 유지)
              slot: existing.slot || nextChar.slot,
              // moodState: 더 긴 description을 가진 것 선택 (정보 손실 방지)
              moodState: (() => {
                const existingDesc = existing.moodState?.description || '';
                const nextDesc = nextChar.moodState?.description || '';
                if (nextDesc.length > existingDesc.length) {
                  return nextChar.moodState;
                } else if (existingDesc.length > 0) {
                  return existing.moodState;
                } else {
                  return nextChar.moodState || existing.moodState;
                }
              })(),
              // visualKey: non-null 우선
              visualKey: existing.visualKey || nextChar.visualKey,
            };
            charMap.set(nextChar.name, mergedChar);
          } else {
            // 새 캐릭터 추가
            charMap.set(nextChar.name, { ...nextChar });
          }
        }
        
        const mergedCharacters = Array.from(charMap.values());
        
        // dialogue_impact는 더 높은 값 선택 (high > medium > low)
        const impactOrder = { low: 0, medium: 1, high: 2 };
        const higherImpact = impactOrder[current.dialogue_impact] >= impactOrder[next.dialogue_impact]
          ? current.dialogue_impact
          : next.dialogue_impact;
        
        // summary는 append 방식 (장면 내용 손실 금지)
        // 단, 두 summary가 실질적으로 동일하면 중복 append 방지
        const currentSummaryNorm = normalizeSummary(current.summary || '');
        const nextSummaryNorm = normalizeSummary(next.summary || '');
        const mergedSummary = current.summary && next.summary
          ? (currentSummaryNorm === nextSummaryNorm 
              ? current.summary  // 동일하면 하나만
              : `${current.summary} / ${next.summary}`)  // 다르면 append
          : (current.summary || next.summary || '');
        
        // backdrop_style은 더 긴 것을 선택 (더 구체적일 가능성)
        const mergedBackdrop = (current.backdrop_style?.length || 0) >= (next.backdrop_style?.length || 0)
          ? current.backdrop_style
          : next.backdrop_style;
        
        current = {
          ...current,
          summary: mergedSummary,
          backdrop_style: mergedBackdrop,
          characters: mergedCharacters, // 제한 없이 전부 유지
          dialogue_impact: higherImpact,
        };
        j++;
      } else {
        break;
      }
    }
    
    merged.push(current);
    i = j;
  }
  
  return merged;
}

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
    
    // Step4: castHints 파싱 (optional, 하위 호환성)
    let castHints: CastHint[] | undefined = undefined;
    if (requestBody.castHints && Array.isArray(requestBody.castHints)) {
      castHints = requestBody.castHints as CastHint[];
      // 빈 배열이면 undefined로 처리
      if (castHints.length === 0) {
        castHints = undefined;
      }
    }

    // botContext 파싱 (optional)
    let botContext: { charName?: string; persona: string; worldview: string; userName?: string; userPersona?: string } | undefined = undefined;
    if (requestBody.botContext && typeof requestBody.botContext === "object") {
      const bc = requestBody.botContext as Record<string, unknown>;
      if ((bc.persona && typeof bc.persona === "string") || (bc.worldview && typeof bc.worldview === "string")) {
        botContext = {
          charName: (bc.charName && typeof bc.charName === "string") ? bc.charName : undefined, // ✅ 추가: 캐릭터 이름
          persona: (bc.persona && typeof bc.persona === "string") ? bc.persona : "",
          worldview: (bc.worldview && typeof bc.worldview === "string") ? bc.worldview : "",
          userName: (bc.userName && typeof bc.userName === "string") ? bc.userName : undefined,
          userPersona: (bc.userPersona && typeof bc.userPersona === "string") ? bc.userPersona : undefined,
        };
      }
    }

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
      !!previousState,
      "castHintsCount=",
      castHints?.length ?? 0,
      "hasBotContext=",
      !!botContext,
      "charName=",
      botContext?.charName || "(null)",
      "personaLen=",
      botContext?.persona?.length ?? 0,
      "worldviewLen=",
      botContext?.worldview?.length ?? 0,
      "userNamePresent=",
      !!botContext?.userName
    );

    // previousState 로깅
    if (previousState) {
      console.log("[AnalyzeChat] Previous state provided:", {
        scene: previousState.scene,
        characterCount: previousState.characters?.length ?? 0,
      });
    }

    // Canonical 블록 생성 (botContext가 있을 때만)
    let canonicalBlock = "";
    if (botContext && (botContext.persona || botContext.worldview)) {
      const parts: string[] = [];
      
      // (1) Protagonist (User)
      if (botContext.userName || botContext.userPersona) {
        const userParts: string[] = [];
        if (botContext.userName) {
          userParts.push(`name: ${botContext.userName}`);
        }
        if (botContext.userPersona) {
          userParts.push(`persona:\n${botContext.userPersona}`);
        }
        if (userParts.length > 0) {
          parts.push(`(1) Protagonist (User)\n${userParts.join("\n")}`);
        }
      }
      
      // (2) Bot / Character Bible
      if (botContext.charName || botContext.persona) {
        const charParts = [];
        if (botContext.charName) {
          charParts.push(`bot name: ${botContext.charName}`);
        }
        if (botContext.persona) {
          charParts.push(`character persona:\n${botContext.persona}`);
        }
        parts.push(`(2) Bot / Character Bible\n${charParts.join('\n')}`);
      }
      
      // (3) World Bible
      if (botContext.worldview) {
        parts.push(`(3) World Bible\nworldview:\n${botContext.worldview}`);
      }
      
      if (parts.length > 0) {
        // 텍스트 길이 안전장치 (30k 이상이면 클리핑)
        const MAX_BIBLE_LENGTH = 30000;
        let bibleText = parts.join("\n\n");
        if (bibleText.length > MAX_BIBLE_LENGTH) {
          console.warn("[analyze-chat] Bible text too long, clipping:", bibleText.length);
          bibleText = bibleText.substring(0, MAX_BIBLE_LENGTH) + "\n[... truncated ...]";
        }
        
        canonicalBlock = `

[CANONICAL CHARACTER & WORLD SETUP]  (절대적 진실/Bible)
- If conflict with chat, Bible wins.
- Bible에 있는 인물이 언급되면, 성격/특징을 반드시 반영하라.

${bibleText}

[/CANONICAL CHARACTER & WORLD SETUP]

`;
      }
    }

    // 프롬프트 구성 (Step3: Multi-scene 지원)
    const systemPrompt = `너는 로맨스 판타지 소설의 '무대 감독'이야. 주어진 대화/텍스트를 분석해서 등장인물, 감정, 분위기, 관계를 JSON 형식으로 추출해줘.

${canonicalBlock}

반드시 다음 JSON 구조를 정확히 따라야 해:

{
  "scenes": [
    {
      "summary": "장면의 한 줄 요약 (예: '왕궁의 연회장에서 주인공과 남주가 첫 만남')",
      "type": "castle" | "room" | "garden" | "hall" | "carriage" | "forest",
      "location_name": "구체적인 장소 이름 (예: '왕궁 연회장', '서재', '정원의 장미꽃길')",
      "backdrop_style": "배경 스타일 설명 (예: '화려한 샹들리에가 달린', '어두운 촛불이 켜진', '햇살이 가득한')",
      "characters": [
        {
          "name": "캐릭터 이름",
          "slot": "left" | "center" | "right" (선택사항),
          "moodState": {
            "label": "joy" | "tension" | "anger" | "sadness" | "fear" | "surprise" | "neutral" | "love" | "contempt",
            "description": "캐릭터의 현재 감정 상태에 대한 간단한 설명 (1-2문장, 필수)"
          }
        }
      ],
      "dialogue_impact": "low" | "medium" | "high"
    }
  ],
  "activeSceneIndex": 0
}

중요 규칙 (누락 금지):
- 원문을 요약해서 장면을 줄이지 말고, 장면 수를 보존하라.
- 한 지문에 여러 장면(장소/시간 전환)이 있으면 반드시 scenes 배열로 분리해라.
- 전환 신호(한편/그 시각/장소 이동/시간 점프)가 있으면 반드시 분리해라.
- 결과는 scenes 배열로 모든 장면을 포함해야 한다.
- 각 scene은 해당 장면에 등장한 캐릭터만 넣기 (전체 캐릭터를 매 scene에 복붙 금지).
- 장면을 합치지 말 것.
- 캐릭터 누락 금지: 지문에 고유명사로 등장하는 모든 인물(예: "제릴", "부관 제릴", "황제", "기사" 등)은 기존 설정에 없어도 반드시 characters 배열에 포함한다. 직책이나 호칭과 함께 언급된 인물도 포함 대상이다.
- 장면 전환 시 캐릭터 정리: 장면(scene)이 전환되면, 해당 장면의 서술에 더 이상 등장하지 않는 인물은 무대(stage)에서 제외할 수 있다.

중복 방지 규칙:
- 같은 location_name(장소 이름)이면 하나의 scene으로 유지하라.
- 같은 장소에서 분위기(backdrop_style)나 감정(moodState)만 바뀌는 경우 scene을 분리하지 말 것.
- location_name이 같으면 반드시 하나의 scene으로 합쳐서 표현하라.
- 같은 장소를 연속으로 여러 scene으로 만들지 말 것.

기술 규칙:
- scenes 배열은 최소 1개 이상이어야 해.
- scene.type은 장면의 배경을 나타내는 타입 중 하나여야 해.
- scene.location_name은 구체적이고 생생한 장소 이름을 제공해 (모르면 빈 문자열 허용).
- scene.backdrop_style은 배경의 분위기나 스타일을 묘사하는 짧은 문구여야 해 (모르면 빈 문자열 허용).
- characters 배열에는 해당 장면에 등장하는 모든 주요 인물을 누락 없이 포함한다. 권장 인원은 2~8명이며, 캐릭터를 임의로 생략하지 않는다. slot은 UI 배치를 위한 힌트이며 필수 값이 아니다. slot이 없는 캐릭터는 backstage 캐릭터로 처리될 수 있다.
- 신규 인물 포함 규칙 (중요): 지문에 고유명사로 등장하는 모든 인물은 CANONICAL CHARACTER & WORLD SETUP에 없어도 반드시 characters에 포함한다. 예: "제릴", "부관 제릴", "황제", "기사", "시녀" 등. 직책/호칭과 함께 언급된 인물도 포함 대상이다.
- 주인공 식별 규칙: userName이 제공되면 해당 인물을 주인공으로 식별하고, slot을 "center"로 우선 배치하라. userName이 없으면 대화 내 {{user}}/화자/1인칭 기준으로 추론하라.
- 이모지 추론 규칙: 각 캐릭터에 representative_emoji를 Bible의 직업/외형/키워드(황태자/기사/대사제 등) 기반으로 추론해 채워라. 예: 황태자→👑, 기사→⚔️, 대사제→⛪️, 마법사→🔮 등.
- 민감정보 필터: cookies/userData/email/session-token 등은 절대 포함/추론/재출력하지 말 것.
- characters 각 항목은 반드시 moodState.description에 최소 1문장 이상의 상태/행동 요약을 포함해야 해 (빈 문자열 금지).
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
- moodState.description은 캐릭터의 현재 감정 상태를 1-2문장으로 설명해.
- dialogue_impact는 대화의 감정적 강도에 따라 결정.
- activeSceneIndex는 마지막 장면의 인덱스 (scenes.length - 1).

중요: 반드시 유효한 JSON만 반환해야 한다. 설명, 주석, 마크다운 코드 블록 없이 순수 JSON만 반환하라.`;

    // Step4: Known Cast 블록 생성 (castHints가 있을 때만)
    let knownCastBlock = "";
    if (castHints && castHints.length > 0) {
      // 안전장치: 최대 30명, aliases 길이 제한
      const MAX_CAST_HINTS = 30;
      const MAX_ALIASES_PER_CHAR = 10;
      
      const limitedHints = castHints.slice(0, MAX_CAST_HINTS);
      const truncatedCount = castHints.length > MAX_CAST_HINTS ? castHints.length - MAX_CAST_HINTS : 0;
      
      // aliases 길이 제한
      const processedHints = limitedHints.map(hint => ({
        id: hint.id,
        canonicalName: hint.canonicalName,
        aliases: (hint.aliases || []).slice(0, MAX_ALIASES_PER_CHAR),
        gender: hint.gender,
      }));
      
      if (truncatedCount > 0) {
        console.log("[analyze-chat] castHints truncated", {
          originalCount: castHints.length,
          truncatedCount: truncatedCount,
        });
      }
      
      const knownCastJson = JSON.stringify(processedHints, null, 2);
      knownCastBlock = `

현재까지 등록된 캐릭터 목록 (Known Characters - use these if they match; do NOT create duplicates):

${knownCastJson}

중요 규칙:
1. 위 목록에 있는 캐릭터는 반드시 재사용하라. 중복 생성하지 말 것.
2. 호칭/별칭("황태자 전하", "페스텔" 등)도 aliases 목록과 매칭하여 기존 캐릭터로 식별하라.
3. 진짜 신규 인물일 때만 새로 생성하라.
4. 멀티씬에서 동일 인물이 반복 등장해도 동일 캐릭터로 처리하라.
5. refId 사용 규칙: 위 목록의 캐릭터에 "id" 필드가 있는 경우에만 refId로 사용하라. id가 없는 캐릭터는 이름/별칭 매칭만 사용하라.`;
      
      // 로깅 (전문 금지: 개수만)
      console.log("[analyze-chat] Known cast injected", {
        count: processedHints.length,
        totalChars: knownCastJson.length,
      });
    }
    
    const systemPromptWithCast = systemPrompt + knownCastBlock;

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

    const userPrompt = `분석할 소설 텍스트:

"""

${trimmedChatText}

"""

${previousStateBlock}

반드시 아래 StoryState 타입에 맞는 JSON만 반환해 (scenes 배열로 모든 장면을 포함):

{
  "scenes": [
    {
      "summary": "장면의 한 줄 요약",
      "type": "castle" | "room" | "garden" | "hall" | "carriage" | "forest",
      "location_name": "구체적인 장소 이름 (모르면 빈 문자열)",
      "backdrop_style": "배경 스타일 설명 (모르면 빈 문자열)",
      "characters": [
        {
          "name": "캐릭터 이름",
          "slot": "left" | "center" | "right" (선택사항, 무대에 표시할 주요 캐릭터만 지정),
          "moodState": {
            "label": "joy" | "tension" | "anger" | "sadness" | "fear" | "surprise" | "neutral" | "love" | "contempt",
            "description": "감정 상태 설명 (1-2문장, 필수)"
          }
        }
      ],
      "dialogue_impact": "low" | "medium" | "high"
    }
  ],
  "activeSceneIndex": 0
}

중요 규칙:
- 장면을 합치지 말고, 전환 신호가 있으면 반드시 분리해라.
- 같은 location_name은 하나의 scene으로 유지하라 (같은 장소 중복 생성 금지).
- 캐릭터 누락 금지: 지문에 고유명사로 등장하는 모든 인물(예: "제릴", "부관 제릴", "황제", "카디론 메비헤르" 등)은 기존 설정에 없어도 반드시 characters 배열에 포함한다. 직책/호칭과 함께 언급된 인물도 포함 대상이다.
- 장면 전환 시 캐릭터 정리: 장면(scene)이 전환되면, 해당 장면의 서술에 더 이상 등장하지 않는 인물은 무대(stage)에서 제외할 수 있다.

⚠️ 반드시 유효한 JSON만 반환하라. 설명, 주석, 마크다운 코드 블록 없이 순수 JSON만 반환하라.`;

    // OpenAI 호출 및 파싱 함수
    const callOpenAIAndParse = async (attempt: number): Promise<StoryState> => {
      const startTime = Date.now();
      console.log(`[AnalyzeChat] Attempt ${attempt} started...`);

      // 프롬프트 길이 로깅 (디버깅용)
      if (attempt === 1) {
        console.log(`[AnalyzeChat] Prompt lengths:`, {
          systemPromptLen: systemPromptWithCast.length,
          userPromptLen: userPrompt.length,
          totalLen: systemPromptWithCast.length + userPrompt.length,
          canonicalBlockLen: canonicalBlock.length,
        });
      }

      // OpenAI API 호출
      let completion;
      try {
        const apiStartTime = Date.now();
        // response_format은 gpt-4o에서 지원하지만, 일부 모델에서는 문제가 될 수 있으므로 주석 처리
        // 필요시 모델별로 조건부 적용 가능
        completion = await openai.chat.completions.create({
          model: ANALYZE_MODEL,
          messages: [
            {
              role: "system",
              content: systemPromptWithCast,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 3000, // v0.2: 새로운 필드 추가로 토큰 수 증가
          // response_format: { type: "json_object" }, // JSON 모드 강제 (일부 모델에서 문제 발생 가능)
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

      // 로깅: 원본 응답 (Step3: 길이만 로깅, 전문은 생략)
      if (attempt === 1) {
        console.log(`[AnalyzeChat] Attempt ${attempt} - OpenAI 응답 수신:`, {
          textLength: content.length,
          textHash: content.substring(0, 50) + "...",
        });
      }

      // JSON 파싱
      const parseStartTime = Date.now();
      let repaired: string;
      let parsed: unknown;
      try {
        // jsonrepair로 JSON 복구 시도
        repaired = jsonrepair(content);
        parsed = JSON.parse(repaired);
        const parseDuration = Date.now() - parseStartTime;
        console.log(`[AnalyzeChat] Attempt ${attempt} - JSON 파싱 성공: ${parseDuration}ms`);
      } catch (parseError) {
        const parseDuration = Date.now() - parseStartTime;
        // 파싱 실패 시 전체 응답 내용 로깅 (디버깅용)
        console.error(`[AnalyzeChat] Attempt ${attempt} - JSON 파싱 실패 (${parseDuration}ms):`, parseError);
        console.error(`[AnalyzeChat] Attempt ${attempt} - 전체 응답 내용:`, content);
        console.error(`[AnalyzeChat] Attempt ${attempt} - 응답 첫 200자:`, content.substring(0, 200));
        throw new Error("PARSE_ERROR");
      }

      // StoryState 구조 검증 및 변환 (Step3: scenes[] 우선, v1 변환)
      if (typeof parsed !== "object" || parsed === null) {
        const duration = Date.now() - startTime;
        console.error(`[AnalyzeChat] Attempt ${attempt} - 응답 타입 오류: ${typeof parsed} (${duration}ms)`);
        throw new Error("INVALID_TYPE");
      }

      const obj = parsed as Record<string, unknown>;

      // Step3: scenes[] 우선 파싱
      let scenes: Scene[] | undefined = undefined;
      let activeSceneIndex: number | undefined = undefined;

      if (Array.isArray(obj.scenes) && obj.scenes.length >= 1) {
        // v2 형식: scenes[] 배열
        scenes = obj.scenes.map((sceneItem: unknown, index: number) => {
          if (typeof sceneItem !== "object" || sceneItem === null) {
            throw new Error(`INVALID_SCENE_ITEM_${index}`);
          }
          const s = sceneItem as Record<string, unknown>;
          
          // scene 기본 필드 검증
          if (
            typeof s.summary !== "string" ||
            typeof s.type !== "string" ||
            !["castle", "room", "garden", "hall", "carriage", "forest"].includes(s.type)
          ) {
            throw new Error(`INVALID_SCENE_FIELDS_${index}`);
          }

          // 선택적 필드 파싱 (빈 값 허용)
          const location_name = typeof s.location_name === "string" ? s.location_name : "";
          const backdrop_style = typeof s.backdrop_style === "string" ? s.backdrop_style : "";

          // characters 검증 (각 scene별)
          if (!Array.isArray(s.characters)) {
            throw new Error(`INVALID_SCENE_CHARACTERS_${index}`);
          }
          const characters = s.characters.map((char: unknown, charIndex: number) => {
            if (typeof char !== "object" || char === null) {
              throw new Error(`INVALID_CHARACTER_ITEM_${index}`);
            }
            const c = char as Record<string, unknown>;
            if (typeof c.name !== "string") {
              throw new Error(`INVALID_CHARACTER_FIELDS_${index}`);
            }
            
            // slot은 optional (없으면 undefined로 처리)
            let slot: "left" | "center" | "right" | undefined = undefined;
            if (c.slot !== undefined && c.slot !== null) {
              if (typeof c.slot === "string" && ["left", "center", "right"].includes(c.slot)) {
                slot = c.slot as "left" | "center" | "right";
              }
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
            
            // Step4 단계 4: refId/isNew 파싱 및 검증
            let refId: string | undefined = undefined;
            let isNew: boolean | undefined = undefined;
            
            // refId 검증 (UUID 형식만 유효)
            if ('refId' in c && c.refId !== null && c.refId !== undefined) {
              if (typeof c.refId === 'string' && c.refId.trim().length > 0) {
                const trimmedRefId = c.refId.trim();
                // UUID 형식 검증: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(trimmedRefId)) {
                  refId = trimmedRefId;
                } else {
                  // 임시 문자열 ("name::", "temp::" 등) 무효 처리
                  console.warn(`[analyze-chat] Invalid refId format in scene ${index} character ${charIndex}:`, trimmedRefId);
                  // refId는 undefined로 유지 (후속 단계에서 Ghost 대상)
                }
              } else {
                console.warn(`[analyze-chat] Invalid refId type in scene ${index} character ${charIndex}:`, typeof c.refId);
              }
            }
            
            // isNew 검증 (refId가 있으면 무시)
            if (!refId && 'isNew' in c && c.isNew !== null && c.isNew !== undefined) {
              if (typeof c.isNew === 'boolean') {
                isNew = c.isNew;
              } else {
                console.warn(`[analyze-chat] Invalid isNew type in scene ${index} character ${charIndex}:`, typeof c.isNew);
              }
            }
            // refId가 있으면 isNew는 무시 (최우선 신호)
            
            return {
              name: c.name,
              slot: slot, // optional: slot이 없으면 undefined
              moodState: moodState,
              refId, // Step4: 추가
              isNew, // Step4: 추가
            };
          });

          // dialogue_impact 검증
          if (
            typeof s.dialogue_impact !== "string" ||
            !["low", "medium", "high"].includes(s.dialogue_impact)
          ) {
            throw new Error(`INVALID_DIALOGUE_IMPACT_${index}`);
          }

          return {
            summary: s.summary,
            type: s.type as "castle" | "room" | "garden" | "hall" | "carriage" | "forest",
            location_name: location_name || undefined,
            backdrop_style: backdrop_style || undefined,
            characters: characters,
            dialogue_impact: s.dialogue_impact as "low" | "medium" | "high",
          };
        });

        // activeSceneIndex 파싱 (기본값: 마지막 장면)
        if (typeof obj.activeSceneIndex === "number" && obj.activeSceneIndex >= 0 && obj.activeSceneIndex < scenes.length) {
          activeSceneIndex = obj.activeSceneIndex;
        } else {
          activeSceneIndex = scenes.length - 1;
        }
        
        // Step4 단계 4: 응답 파싱 로깅 (전문 금지: 개수/통계만)
        const charactersWithRefId = scenes.reduce((sum, s) => 
          sum + s.characters.filter(c => c.refId).length, 0
        );
        const charactersWithIsNew = scenes.reduce((sum, s) => 
          sum + s.characters.filter(c => c.isNew === true).length, 0
        );
        const locationNames = scenes.map(s => s.location_name || '(없음)').slice(0, 5);
        
        console.log('[analyze-chat] Response parsed', {
          scenesCount: scenes.length,
          charactersWithRefId,
          charactersWithIsNew,
          locationNames: locationNames.length > 5 ? locationNames.join(', ') + '...' : locationNames.join(', '),
        });
      } else if (obj.scene && typeof obj.scene === "object") {
        // v1 형식: scene 단일 → scenes[]로 변환
        const scene = obj.scene as Record<string, unknown>;
        if (
          typeof scene.summary !== "string" ||
          typeof scene.type !== "string" ||
          !["castle", "room", "garden", "hall", "carriage", "forest"].includes(scene.type)
        ) {
          throw new Error("INVALID_SCENE_FIELDS");
        }

        // v1 필드 파싱
        const location_name = typeof scene.location_name === "string" ? scene.location_name : "";
        const backdrop_style = typeof scene.backdrop_style === "string" ? scene.backdrop_style : "";

        // characters 검증
        if (!Array.isArray(obj.characters)) {
          throw new Error("INVALID_CHARACTERS");
        }
        const characters = obj.characters.map((char: unknown) => {
          if (typeof char !== "object" || char === null) {
            throw new Error("INVALID_CHARACTER_ITEM");
          }
          const c = char as Record<string, unknown>;
          if (typeof c.name !== "string") {
            throw new Error("INVALID_CHARACTER_FIELDS");
          }
          
          // slot은 optional (없으면 undefined로 처리)
          let slot: "left" | "center" | "right" | undefined = undefined;
          if (c.slot !== undefined && c.slot !== null) {
            if (typeof c.slot === "string" && ["left", "center", "right"].includes(c.slot)) {
              slot = c.slot as "left" | "center" | "right";
            }
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
            slot: slot, // optional: slot이 없으면 undefined
            moodState: moodState,
          };
        });

        // dialogue_impact 검증
        if (
          typeof obj.dialogue_impact !== "string" ||
          !["low", "medium", "high"].includes(obj.dialogue_impact)
        ) {
          throw new Error("INVALID_DIALOGUE_IMPACT");
        }

        // v1 → v2 변환: scenes 배열로 변환
        scenes = [{
          summary: scene.summary,
          type: scene.type as "castle" | "room" | "garden" | "hall" | "carriage" | "forest",
          location_name: location_name || undefined,
          backdrop_style: backdrop_style || undefined,
          characters: characters,
          dialogue_impact: obj.dialogue_impact as "low" | "medium" | "high",
        }];
        activeSceneIndex = 0; // v1 변환 시 첫 번째(유일한) 장면
      } else {
        throw new Error("INVALID_RESPONSE_FORMAT");
      }

      // 최종 검증: scenes는 필수
      if (!scenes || scenes.length === 0) {
        throw new Error("INVALID_SCENES");
      }

      // Step3.1: 인접 중복 scene 병합 (postprocess)
      const originalScenesCount = scenes.length;
      const mergedScenes = mergeAdjacentDuplicateScenes(scenes);
      const mergedScenesCount = mergedScenes.length;
      
      // activeSceneIndex 재계산 (병합 후 마지막 장면)
      const finalActiveSceneIndex = mergedScenes.length > 0 ? mergedScenes.length - 1 : 0;
      
      if (originalScenesCount !== mergedScenesCount) {
        console.log(`[AnalyzeChat] Merged ${originalScenesCount} scenes → ${mergedScenesCount} scenes`);
      }

      // StoryStateV2 형태로 정규화 (v2 필드만 확실히 채움)
      const state: StoryStateV2 = {
        scenes: mergedScenes,
        activeSceneIndex: finalActiveSceneIndex,
      };

      // 로깅: scenes 정보만 (전문 텍스트 제외)
      const totalDuration = Date.now() - startTime;
      const locationNames = state.scenes.slice(0, 5).map(s => s.location_name || "(없음)").join(", ");
      console.log(`[AnalyzeChat] Attempt ${attempt} - 완료: ${totalDuration}ms`, {
        scenesCount: state.scenes.length,
        activeSceneIndex: state.activeSceneIndex,
        locationNames: state.scenes.length > 5 ? locationNames + "..." : locationNames,
      });

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


