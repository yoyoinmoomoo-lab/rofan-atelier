import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GenerateNamesRequest } from "@/app/types";

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

// 라벨은 UI 표시용
const GENDER_LABELS: Record<string, string> = {
  female: "여성",
  male: "남성",
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
    const body: GenerateNamesRequest = await request.json();

    // 입력 검증
    if (!body.culture || !body.gender || !body.class || !body.era) {
      return NextResponse.json(
        { error: "필수 입력값이 누락되었습니다." },
        { status: 400 }
      );
    }

    const cultureEng = CULTURE_MAP[body.culture]; // GPT 입력용
    const genderLabel = GENDER_LABELS[body.gender];
    const classLabel = CLASS_LABELS[body.class];
    const eraLabel = ERA_LABELS[body.era];

    // 매핑 검증
    if (!cultureEng || !genderLabel || !classLabel || !eraLabel) {
      return NextResponse.json(
        { error: "잘못된 입력값입니다." },
        { status: 400 }
      );
    }

    const includeNickname = body.includeNickname ? "예" : "아니오";

    const prompt = `당신은 '한국 로맨스 판타지(로판) 소설 작가들을 위한 서양식 이름 생성 전문 AI'입니다.

[입력 조건]
- 문화권(영문 설명): ${cultureEng}
- 성별: ${genderLabel}
- 계급(톤): ${classLabel}
- 시대감: ${eraLabel}
- 애칭 포함 여부: ${includeNickname}

[세계관·톤 일관성 규칙]
1. 이름은 반드시 '지정된 문화권과 시대감 안에서' 자연스럽게 존재할 법한 형태여야 합니다.
2. 같은 나라·가문·시대에 속한 사람들처럼, 발음·느낌·어원이 일관된 톤을 유지합니다.
3. 문화권이 뒤섞인 부조화(예: 슬라브+영미+그리스 혼합)는 절대 금지합니다.
4. 우스꽝스럽거나 패러디, 과도한 판타지식 이름 금지.
   - 허용 예: 실제 서양식 이름의 느낌을 유지한 로판식 변형 (Aveline → Avelyne, Mirelle → Mirélle)
   - 금지 예: Thraxxia, Zelorin, Uvarith 등

[이름 형식 규칙 – 서양식 First name만 생성]
1. 성·가문명·작위·호칭(공주·왕자·경 등) 절대 금지.
2. korean 표기는 '순수 한글 음역'만 사용합니다.
   - 한국어 단어처럼 보이는 비자연스러운 표기(나는, 가나 등)는 금지.
3. roman 표기는 알파벳만 사용하며 한글 금지.
4. desc 내에서 이름을 다시 반복하지 않습니다.

[애칭 규칙 – Roman + Korean 두 가지 모두 제공]
1. nicknameRoman: 반드시 알파벳만 사용한 서양식 애칭입니다. (예: Lizzy, Addie, Cece)
2. nicknameKorean: nicknameRoman의 자연스러운 한글 음역입니다. (예: 리지, 애디, 씨씨)
3. 둘 다 단일 단어여야 하며 문장형 금지.

[이름 다양성 규칙]
1. 이름 끝 음절(-a, -e, -ine, -elle, -eth, -is, -lin, -ra 등)을 다양하게 섞습니다.
   - 10개 중 -a로 끝나는 이름은 최대 3개까지만 허용합니다.
2. 실제 존재하는 이름 + 로판식 창작형 변형을 함께 사용합니다.
3. 음절은 2~4음절로 구성하며 다양한 패턴을 섞습니다.
4. 귀족/왕족은 우아하고 길게, 서민은 간단하고 짧게.

[desc 규칙]
- desc는 반드시 20자 내외의 짧은 '키워드 설명'으로 작성합니다.
- 예: "세련된 느낌", "침착한 성격", "예술 감각", "지적이고 조용함"

[문화권별 음역 참고 예시 (참고만 하고 그대로 복사하지 마세요)]
- French: 카미유(Camille), 셀린(Céline), 오렐리(Aurélie), 비비엔느(Vivienne)
- Germanic/Nordic: 그레타(Greta), 아니카(Annika), 프리다(Frida), 리네아(Linnea)
- Latin: 카밀라(Camila), 마리나(Marina), 비비아나(Viviana)
- Slavic: 엘레나(Elena), 밀레나(Milena), 라리사(Larisa)
- Greek: 칼리스타(Calista), 탈리아(Thalia), 세레네(Selene)

[출력 구조]
- 정확히 10개의 이름을 생성합니다.

{
  "names": [
    {
      "korean": "",
      "roman": "",
      "classTone": "${classLabel}풍",
      "nicknameRoman": "",
      "nicknameKorean": "",
      "desc": ""
    }
  ]
}

JSON만 출력합니다. 다른 텍스트는 절대 포함하지 마세요.`;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
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
    } catch (apiError: any) {
      console.error("OpenAI API 에러:", apiError);
      if (apiError.status === 401) {
        throw new Error("OpenAI API 키가 유효하지 않습니다.");
      } else if (apiError.status === 429) {
        throw new Error("API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.");
      } else if (apiError.status === 500) {
        throw new Error("OpenAI 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
      throw new Error(`OpenAI API 호출 실패: ${apiError.message || "알 수 없는 오류"}`);
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error("OpenAI 응답이 비어있음:", completion);
      throw new Error("OpenAI로부터 응답을 받지 못했습니다.");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
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

    // 각 이름의 필수 필드 검증 및 기본값 설정
    parsed.names = parsed.names.map((n: any) => {
      const name = {
        korean: n.korean || "",
        roman: n.roman || "",
        classTone: n.classTone || `${classLabel}풍`,
        nicknameRoman: body.includeNickname ? (n.nicknameRoman || "") : "",
        nicknameKorean: body.includeNickname ? (n.nicknameKorean || "") : "",
        desc: n.desc || "",
      };
      
      // 필수 필드 검증
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

