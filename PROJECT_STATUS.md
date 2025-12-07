# 📋 Rofan Atelier 프로젝트 현황 문서

> **목적**: GPT가 프로젝트를 이해하고 작업을 이어받을 수 있도록 현재 상태를 정리한 문서

---

## 🎯 프로젝트 개요

**rofan-atelier** (로판 아틀리에)는 로맨스 판타지 작가들을 위한 이름 생성 및 시각화 도구입니다.

- **기술 스택**: Next.js 16 (App Router), TypeScript, Tailwind CSS, OpenAI API
- **포트**: 3001
- **배포**: Vercel (예정)

---

## 📁 프로젝트 구조

```
rofan-atelier/
├── app/
│   ├── api/                          # API 라우트 (Next.js App Router)
│   │   ├── analyze-chat/            # ⭐ Visualboard 분석 API (최신 추가)
│   │   │   └── route.ts
│   │   ├── generate-names/           # 이름 생성 API
│   │   ├── generate-families/        # 가문명 생성 API
│   │   ├── generate-character-names/ # 캐릭터 이름 생성 API
│   │   └── feedback/                 # 피드백 API (Notion 연동)
│   │
│   ├── components/                    # React 컴포넌트
│   │   ├── visualboard/              # ⭐ Visualboard 컴포넌트 (최신 추가)
│   │   │   ├── VisualBoard.tsx      # 메인 시각화 컴포넌트
│   │   │   ├── CharacterSprite.tsx   # 캐릭터 스프라이트
│   │   │   └── RelationPanel.tsx    # 관계 패널 (v0에서 비활성화)
│   │   ├── NameGenerator.tsx
│   │   ├── FamilyGenerator.tsx
│   │   ├── CharacterNameGenerator.tsx
│   │   └── ... (기타 공통 컴포넌트)
│   │
│   ├── test-board/                    # ⭐ Visualboard 테스트 페이지 (최신 추가)
│   │   └── page.tsx
│   │
│   ├── i18n/                         # 다국어 지원 (한국어/영어)
│   │   ├── uiText.ts                 # UI 텍스트 딕셔너리
│   │   ├── uiText.character.ts
│   │   └── resources.ts              # 리소스 경로 (이미지, 링크 등)
│   │
│   ├── types.ts                      # TypeScript 타입 정의
│   ├── layout.tsx                    # 루트 레이아웃
│   └── page.tsx                      # 메인 페이지
│
├── config/
│   └── generationProfile.ts          # 생성 프로필 설정
│
└── public/                           # 정적 파일
```

---

## 🆕 최근 추가된 기능: Visualboard

### 개요
소설 텍스트를 분석하여 **장면(Scene)**과 **캐릭터 배치(Characters)**를 시각화하는 기능입니다.

### 현재 상태 (v0 출시 준비)
- ✅ **배경(Scene)**: 장면 타입과 요약 표시
- ✅ **캐릭터 배치**: 캐릭터 이름과 위치(left/center/right) 표시
- ❌ **관계(Relations)**: v0에서 제외 (API는 빈 배열 반환)
- ❌ **감정(Mood)**: v0에서 제외 (모든 캐릭터는 'neutral'로 고정)

---

## 🔌 API 엔드포인트

### 1. `/api/analyze-chat` (POST) ⭐ 최신 추가

**목적**: 소설 텍스트를 분석하여 StoryState 반환

**요청:**
```typescript
{
  chatText: string;  // 분석할 소설 텍스트 (최대 50,000자)
}
```

**응답:**
```typescript
{
  state: {
    scene: {
      summary: string;  // 장면 한 줄 요약
      type: "castle" | "room" | "garden" | "hall" | "carriage" | "forest"
    },
    characters: Array<{
      name: string;
      slot: "left" | "center" | "right";
      mood: "neutral";  // v0: 항상 neutral로 고정
    }>,
    relations: [];  // v0: 항상 빈 배열
    dialogue_impact: "low" | "medium" | "high"
  }
}
```

**특징:**
- OpenAI GPT-4o-mini 사용
- CORS 헤더 포함 (Chrome Extension 호출 대비)
- JSON 파싱 에러 복구 (`jsonrepair` 사용)
- 재시도 로직 포함 (파싱 실패 시 1회 재시도)

**파일 위치**: `app/api/analyze-chat/route.ts`

---

### 2. `/api/generate-names` (POST)

**목적**: 문화권/성별/계급에 맞는 이름 생성

**파일 위치**: `app/api/generate-names/route.ts`

---

### 3. `/api/generate-families` (POST)

**목적**: 가문명 생성

**파일 위치**: `app/api/generate-families/route.ts`

---

### 4. `/api/generate-character-names` (POST)

**목적**: 캐릭터 이름 생성 (어조 강도, 시대감 등 세부 옵션)

**파일 위치**: `app/api/generate-character-names/route.ts`

---

## 🎨 주요 컴포넌트

### Visualboard 관련 (최신)

#### `VisualBoard.tsx`
- **위치**: `app/components/visualboard/VisualBoard.tsx`
- **역할**: StoryState를 받아서 전체 시각화 화면 렌더링
- **Props**:
  ```typescript
  {
    state: StoryState;
    lang: "ko" | "en";
  }
  ```
- **렌더링 요소**:
  - 장면 정보 카드 (타입 + 요약)
  - 배경 그라데이션 (장면 타입별)
  - 캐릭터 배치 영역 (슬롯별)

#### `CharacterSprite.tsx`
- **위치**: `app/components/visualboard/CharacterSprite.tsx`
- **역할**: 개별 캐릭터 스프라이트 렌더링
- **Props**:
  ```typescript
  {
    name: string;
    slot: "left" | "center" | "right";
    lang: "ko" | "en";
  }
  ```
- **v0 변경사항**: mood 이모지/라벨 제거, 이름만 표시

#### `RelationPanel.tsx`
- **위치**: `app/components/visualboard/RelationPanel.tsx`
- **상태**: v0에서 비활성화 (VisualBoard에서 렌더링하지 않음)
- **미래용**: 관계 기능 추가 시 재활성화 예정

---

## 📄 페이지

### `/test-board` ⭐ 최신 추가

**위치**: `app/test-board/page.tsx`

**기능**:
- 텍스트 입력 (Textarea)
- "분석하기" 버튼으로 API 호출
- VisualBoard 컴포넌트로 결과 시각화
- 로딩/에러 상태 관리

**접속**: `http://localhost:3001/test-board`

---

## 📝 타입 정의

### StoryState (핵심 타입)

**위치**: `app/types.ts` (90-114줄)

```typescript
export interface StoryState {
  scene: {
    summary: string;
    type: SceneType;  // "castle" | "room" | "garden" | "hall" | "carriage" | "forest"
  };
  characters: Array<{
    name: string;
    slot: CharacterSlot;  // "left" | "center" | "right"
    mood: CharacterMood;  // v0에서는 항상 "neutral"
  }>;
  relations: Array<{...}>;  // v0에서는 항상 빈 배열
  dialogue_impact: "low" | "medium" | "high";
}
```

**참고**: 타입 정의는 그대로 유지 (미래 확장 대비), 실제 동작은 v0 제약사항 적용

---

## 🌐 i18n (다국어) 시스템

### 규칙
- **모든 UI 텍스트는 하드코딩 금지**
- `app/i18n/uiText.ts`에 key-value로 정의
- 컴포넌트에서는 `getUIText(key, lang)` 함수 사용

### Visualboard 관련 키 (최신 추가)
- `visualboardTitle`
- `visualboardSceneLabel`
- `visualboardCharactersLabel`
- `visualboardNoCharacters`
- `testBoardTitle`
- `testBoardAnalyzeButton`
- 등등...

**위치**: `app/i18n/uiText.ts`

---

## 🎨 스타일링

### Tailwind CSS 사용
- 커스텀 CSS 변수 정의 (`app/globals.css`)
- 색상 팔레트:
  - `--background`: 크림 베이지
  - `--accent`: 로즈 골드
  - `--card-bg`: 흰색
  - `--card-border`: 로즈 골드

### 장면 배경 그라데이션
각 장면 타입별로 다른 그라데이션 적용:
- `castle`: stone 그라데이션
- `room`: amber 그라데이션
- `garden`: green 그라데이션
- `hall`: yellow 그라데이션
- `carriage`: gray 그라데이션
- `forest`: emerald 그라데이션

**위치**: `app/components/visualboard/VisualBoard.tsx` (14-21줄)

---

## 🔧 환경 변수

### 필수
- `OPENAI_API_KEY`: OpenAI API 키

### 선택 (피드백 기능용)
- `NOTION_TOKEN`
- `NOTION_FEEDBACK_SOURCE` 또는 `NOTION_FEEDBACK_DB`
- `NOTION_FEEDBACK_TEMPLATE`

---

## 📊 개발 이력 (최근)

### Phase 1: API 개발
- ✅ `/api/analyze-chat` 엔드포인트 생성
- ✅ StoryState 타입 정의
- ✅ OpenAI 통합 및 JSON 파싱
- ✅ CORS 헤더 설정

### Phase 2: 컴포넌트 개발
- ✅ VisualBoard 메인 컴포넌트
- ✅ CharacterSprite 컴포넌트
- ✅ RelationPanel 컴포넌트 (비활성화)

### Phase 3: 통합 테스트
- ✅ `/test-board` 테스트 페이지 생성
- ✅ 전체 플로우 검증 (입력 → API → 시각화)

### Phase 4: v0 출시 준비
- ✅ 관계(Relations) 기능 제거
- ✅ 감정(Mood) 기능 제거
- ✅ UI 정리 (배경 + 캐릭터 배치만 표시)

---

## 🚀 다음 단계 (GPT가 작업할 내용)

### 현재 상태
- ✅ Backend API 완료
- ✅ Frontend 컴포넌트 완료
- ✅ 테스트 페이지 완료
- ✅ v0 기능 축소 완료

### 가능한 작업 방향
1. **UI/UX 개선**: 배경 이미지 추가, 캐릭터 스프라이트 이미지화
2. **기능 확장**: 관계/감정 기능 재활성화
3. **성능 최적화**: API 응답 시간 개선
4. **에러 처리 강화**: 더 나은 에러 메시지
5. **테스트 추가**: 단위 테스트, 통합 테스트

---

## 📌 중요 참고사항

### 프로젝트 규칙
1. **i18n 필수**: 모든 UI 텍스트는 `uiText.ts`에 정의
2. **타입 안전성**: TypeScript strict 모드
3. **함수형 컴포넌트**: 클래스 컴포넌트 사용 금지
4. **"use client"**: 클라이언트 컴포넌트에만 사용

### 코드 스타일
- 기존 API 패턴 준수 (`generate-character-names/route.ts` 참고)
- 에러 핸들링 패턴 일관성 유지
- 로깅: `console.log`로 디버깅 정보 출력

---

## 🔗 관련 파일 경로 요약

### 핵심 파일
- **API**: `app/api/analyze-chat/route.ts`
- **타입**: `app/types.ts` (90-122줄)
- **메인 컴포넌트**: `app/components/visualboard/VisualBoard.tsx`
- **테스트 페이지**: `app/test-board/page.tsx`
- **i18n**: `app/i18n/uiText.ts`

### 참고 파일
- **기존 API 예시**: `app/api/generate-character-names/route.ts`
- **레이아웃**: `app/layout.tsx`
- **스타일**: `app/globals.css`

---

## 💡 GPT에게 전달할 핵심 메시지

1. **프로젝트는 Next.js 16 App Router 기반**
2. **Visualboard 기능이 최근 추가됨** (배경 + 캐릭터 배치)
3. **v0에서는 관계/감정 기능 제외**
4. **모든 UI 텍스트는 i18n 시스템 사용 필수**
5. **기존 코드 패턴을 따라야 함** (에러 핸들링, 로깅 등)

---

**문서 작성일**: 2024년
**프로젝트 버전**: v0 (출시 준비 중)

