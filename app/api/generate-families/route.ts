import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GenerateFamiliesRequest, FamilyResult } from "@/app/types";
import { jsonrepair } from "jsonrepair";

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

const CLASS_LABELS: Record<string, string> = {
  royal: "왕족",
  noble: "귀족",
  commoner: "서민",
};

const ERA_LABELS: Record<string, string> = {
  medieval: "중세풍",
  romantic: "낭만풍",
  modern19: "근대 19세기풍",
};

export async function POST(request: NextRequest) {
  try {
    const body: GenerateFamiliesRequest = await request.json();

    // 입력 검증
    if (!body.culture || !body.class || !body.era) {
      return NextResponse.json(
        { error: "필수 입력값이 누락되었습니다." },
        { status: 400 }
      );
    }

    const cultureEng = CULTURE_MAP[body.culture]; // GPT 입력용
    const classLabel = CLASS_LABELS[body.class];
    const eraLabel = ERA_LABELS[body.era];

    // 매핑 검증
    if (!cultureEng || !classLabel || !eraLabel) {
      return NextResponse.json(
        { error: "잘못된 입력값입니다." },
        { status: 400 }
      );
    }

    const prompt = `당신은 '로맨스 판타지(로판) 세계관의 서양식 가문명을 생성하는 전문 AI'입니다.

[입력 조건]
- 문화권(영문 설명): ${cultureEng}
- 계급(톤): ${classLabel}
- 시대감: ${eraLabel}

[세계관·톤 일관성 규칙]
1. 가문명은 반드시 '지정된 문화권과 시대감 안에서' 자연스럽게 존재할 법한 형태여야 합니다.
2. 같은 나라·시대의 귀족 가문처럼, 발음·느낌·어원이 일관된 톤을 유지합니다.
3. 문화권이 서로 뒤섞인 느낌(예: 슬라브+그리스+영미 조합)은 금지합니다.
4. 우스꽝스럽거나 패러디 같은 가문명, 과도한 판타지식 가문명은 금지합니다.
   - 허용 예: 실제 서양식 가문명의 느낌을 유지한 로판식 변형
   - 금지 예: 부자연스럽거나 판타지스러운 엔딩 (예: -xas, -'tor 등)

[가문명 형식 규칙]
1. 가문명은 Western식 Family name / House name만 생성합니다.
2. 성·작위·칭호·호칭 금지.
3. 왕족/귀족은 '전통/학자/기사단/사교계/황실' 등의 상징적 톤을 포함하되 과하지 않게.
4. 서민은 지역명/직업 기반 성씨 느낌으로.
5. 한글 표기(korean)는 반드시 '순수 한글 음역'만 사용합니다.
   - 한국어 단어처럼 보이는 비자연스러운 표기는 금지.
   - 영어 알파벳 금지.
6. roman 표기는 '알파벳만' 사용하며 한글 금지.

desc 규칙:
- 반드시 20자 내외로 짧게.
- 문장형이 아닌 키워드 중심.
- 예: "전통 기사 가문", "사교계 명문", "음악 전통", "상업 중심"

[문화권별 음역 참고 예시 (참고만 하고 그대로 복사하지 마세요)]
- French: 드 라벨(de Lavelle), 드 몽테뉴(de Montaigne), 드 보르봉(de Bourbon)
- Germanic/Nordic: 폰 호엔촐레른(von Hohenzollern), 폰 하펜(von Hafen), 베르그만(Bergman)
- Latin: 델 토로(del Toro), 데 라 크루즈(de la Cruz), 몬테네그로(Montenegro)
- Slavic: 이바노프(Ivanov), 페트로프(Petrov), 볼코프(Volkov)
- Greek: 파파도풀로스(Papadopoulos), 안드로니코스(Andronikos)

[규칙]
1. 조건에 맞는 가문명이나 성씨를 10개 생성합니다.
2. 구성 요소:
   - korean: 한글 표기
   - roman: 로마자 표기
   - tone: "${classLabel}"
   - keywords: 2~3개 키워드 배열
   - desc: 20자 내외 키워드 중심 설명
3. 왕족/귀족은 전통·기사·사교계 등 상징성 반영.
4. 서민은 직업 기반·지역 기반 이름을 생성.
5. JSON만 출력합니다. 다른 텍스트는 절대 포함하지 마세요.

[출력 형식]
{
  "families": [
    {
      "korean": "",
      "roman": "",
      "tone": "",
      "keywords": ["", ""],
      "desc": ""
    }
  ]
}`;

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
      const family: FamilyResult = {
        korean: typeof f.korean === "string" ? f.korean : "",
        roman: typeof f.roman === "string" ? f.roman : "",
        tone: typeof f.tone === "string" ? f.tone : classLabel,
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

