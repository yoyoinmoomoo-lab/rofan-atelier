# 🤖 GPT 작업용 컨텍스트 문서

> **이 문서를 GPT에게 전달하면 프로젝트를 즉시 이해하고 작업을 시작할 수 있습니다.**

---

## 📌 프로젝트 한 줄 요약

**로판 아틀리에**: 로맨스 판타지 작가용 이름 생성기 + 최근 추가된 **Visualboard** (소설 텍스트 → 장면/캐릭터 시각화)

---

## 🎯 현재 작업 중인 기능: Visualboard

### 상태
- ✅ **완료**: API (`/api/analyze-chat`), 컴포넌트 (`VisualBoard`, `CharacterSprite`), 테스트 페이지 (`/test-board`)
- 🎯 **v0 출시 준비**: 관계/감정 기능 제거, 배경+캐릭터 배치만 표시

### 핵심 파일
```
app/api/analyze-chat/route.ts          ← API 엔드포인트
app/components/visualboard/VisualBoard.tsx  ← 메인 컴포넌트
app/components/visualboard/CharacterSprite.tsx  ← 캐릭터 표시
app/test-board/page.tsx                ← 테스트 페이지
app/types.ts (90-122줄)               ← StoryState 타입
```

---

## 🔑 핵심 타입

```typescript
// app/types.ts
export interface StoryState {
  scene: {
    summary: string;
    type: "castle" | "room" | "garden" | "hall" | "carriage" | "forest";
  };
  characters: Array<{
    name: string;
    slot: "left" | "center" | "right";
    mood: "neutral";  // v0: 항상 neutral
  }>;
  relations: [];  // v0: 항상 빈 배열
  dialogue_impact: "low" | "medium" | "high";
}
```

---

## 🚨 필수 규칙

1. **i18n 필수**: 모든 UI 텍스트는 `app/i18n/uiText.ts`에 정의 후 `getUIText(key, lang)` 사용
2. **타입 안전성**: TypeScript strict 모드
3. **함수형 컴포넌트**: 클래스 컴포넌트 금지
4. **"use client"**: 클라이언트 컴포넌트에만 사용

---

## 📂 파일 구조 (핵심만)

```
app/
├── api/analyze-chat/route.ts          ← Visualboard API
├── components/visualboard/            ← Visualboard 컴포넌트
├── test-board/page.tsx                ← 테스트 페이지
├── types.ts                           ← 타입 정의
└── i18n/uiText.ts                     ← 다국어 텍스트
```

---

## 🔧 API 사용법

```typescript
// POST /api/analyze-chat
const response = await fetch("/api/analyze-chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chatText: "소설 텍스트..." })
});
const { state } = await response.json(); // StoryState
```

---

## 🎨 컴포넌트 사용법

```tsx
import VisualBoard from "@/app/components/visualboard/VisualBoard";

<VisualBoard state={storyState} lang="ko" />
```

---

## 📝 작업 시 참고할 기존 코드 패턴

### API 라우트 패턴
- `app/api/generate-character-names/route.ts` 참고
- 에러 핸들링, 재시도 로직, 로깅 패턴 동일하게 적용

### 컴포넌트 패턴
- `app/components/NameGenerator.tsx` 참고
- 상태 관리, API 호출, 로딩/에러 처리 패턴 동일

---

## 🎯 v0 제약사항

- ❌ **관계(Relations)**: API는 빈 배열 반환, UI에서 렌더링 안 함
- ❌ **감정(Mood)**: 모든 캐릭터는 'neutral'로 고정, UI에서 표시 안 함
- ✅ **배경(Scene)**: 정상 작동
- ✅ **캐릭터 배치**: 정상 작동

---

## 🚀 다음 작업 예시

1. **UI 개선**: 배경 이미지 추가, 캐릭터 스프라이트 이미지화
2. **기능 확장**: 관계/감정 기능 재활성화
3. **성능 최적화**: API 응답 시간 개선
4. **에러 처리**: 더 나은 에러 메시지

---

**더 자세한 정보는 `PROJECT_STATUS.md` 참고**

