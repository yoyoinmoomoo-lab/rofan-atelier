# 로판월드(rofan.world) i18n 구조 진단 리포트

## 1. 프로젝트 구조 및 i18n 관련 파일 찾기

### 발견된 i18n 관련 파일/디렉토리

- **`app/i18n/uiText.ts`** - 메인 translation 파일
  - `getUIText(key, lang)` 함수로 key 기반 접근
  - `UI_TEXT` 객체에 ko/en 텍스트 정의
  - TypeScript 타입 안전성 제공 (`UITextKey`)

- **`app/utils/langUtils.ts`** - 언어 유틸리티
  - `getInitialLang()` - URL/localStorage 기반 초기 언어 결정
  - `isSupportedLang()` - 지원 언어 검증

- **`app/utils/getDisplayClassLabel.ts`** - 계급 라벨 표시 유틸

- **`app/constants.ts`** - 다국어 옵션 정의
  - `CULTURE_OPTIONS`, `GENDER_OPTIONS`, `CLASS_OPTIONS`, `ERA_OPTIONS`
  - 각 옵션의 `label`이 `{ ko: string, en: string }` 형태

- **`config/generationProfile.ts`** - API용 언어 프로필
  - `GENERATION_PROFILES` - 언어별 필드 언어 설정

### 사용 중인 다국어 처리 방식

**커스텀 i18n 구조** (외부 라이브러리 미사용)
- `getUIText(key, lang)` 함수 기반 접근
- `lang` prop을 컴포넌트에 전달하는 방식
- URL 쿼리 파라미터(`?lang=en`) + localStorage로 언어 상태 유지
- Next.js의 `useSearchParams()` 사용

**장점:**
- 외부 의존성 없음 (번들 크기 작음)
- TypeScript 타입 안전성
- 간단한 구조로 이해하기 쉬움

**단점:**
- 복수형/단수형 처리, 날짜/숫자 포맷팅 등 고급 기능 부재
- 네임스페이스 구조 없음 (모든 키가 평면적)
- 동적 번역 파라미터 처리 제한적

---

## 2. UI 텍스트 관리 방식 점검

### 현재 상태: **2) 일부만 translation 파일에 있고 나머지는 컴포넌트에 하드코딩된 경우**

### ✅ Translation 파일로 관리되는 텍스트

**`app/i18n/uiText.ts`에 정의된 키들:**
- 앱 제목/부제목 (`appTitle`, `appSubtitle`)
- 탭 라벨 (`namesTabLabel`, `familiesTabLabel`)
- 폼 라벨 (`cultureLabel`, `genderLabel`, `classLabel`, `eraLabel`)
- 버튼 텍스트 (`generateNamesButton`, `generateFamiliesButton`, `copyNameButton` 등)
- 피드백 관련 텍스트 (전체)
- 에러 메시지 (`errorGenerateNames`, `errorGenerateFamilies`)

**사용 예시:**
```tsx
{getUIText("appTitle", lang)}
{getUIText("cultureLabel", currentLang)}
```

### ⚠️ 하드코딩된 텍스트 예시

1. **`app/page.tsx` (line 140)**
   ```tsx
   <div className="text-[var(--text-muted)]">Loading...</div>
   ```
   → `getUIText("loading", lang)` 사용 권장

2. **`app/layout.tsx` (line 33-35, 38-39, 49, 54-55)**
   ```tsx
   title: "Rofan Atelier – 로맨스 판타지 세계관 이름 생성기",
   description: "로맨스 판타지 세계를 위한 이름과 가문명을 빚어드립니다...",
   locale: "ko_KR",  // 하드코딩
   ```
   → 메타데이터는 동적 생성 필요 (Next.js Metadata API의 `generateMetadata` 사용)

3. **`app/components/LanguageSelector.tsx` (line 34-36)**
   ```tsx
   export const LANGUAGES: { code: LangCode; label: string }[] = [
     { code: "ko", label: "한국어" },
     { code: "en", label: "English" },
   ];
   ```
   → 이미 다국어 구조이지만, `uiText.ts`로 통합 가능

4. **조건부 분기 로직 (여러 파일)**
   ```tsx
   // app/components/NameGenerator.tsx
   const getDisplayName = (lang: LangCode, korean: string, roman: string) =>
     lang === "en" ? roman : `${korean} / ${roman}`;
   ```
   → 이는 데이터 표시 로직이므로 하드코딩이 아닌 비즈니스 로직으로 볼 수 있음

### 📊 통계

- **Translation 파일로 관리:** 약 70%
- **하드코딩/조건부 분기:** 약 30%
  - 메타데이터 (layout.tsx)
  - 로딩 메시지
  - 일부 상수값

---

## 3. 언어별 리소스(이미지, 링크 등) i18n 관리 확인

### ❌ 현재 상태: 리소스가 translation으로 관리되지 않음

### 발견된 리소스 사용

1. **`app/layout.tsx` - 메타데이터 이미지**
   ```tsx
   images: [{ url: "/ogimage.png", ... }]
   ```
   → 언어별 OG 이미지가 없음 (현재 단일 이미지 사용)

2. **아이콘/파비콘**
   ```tsx
   { url: "/favicon-16x16.png", ... }
   { url: "/apple-touch-icon.png", ... }
   ```
   → 언어별 아이콘 없음

3. **HTML lang 속성**
   ```tsx
   <html lang="ko">  // 하드코딩
   ```
   → 현재 언어에 따라 동적으로 변경되어야 함

### 권장 구조 (현재 미구현)

```typescript
// app/i18n/resources.ts
export const RESOURCES = {
  ko: {
    ogImage: "/ogimage-ko.png",
    favicon: "/favicon-ko.png",
    pdf: "/docs/guide-ko.pdf",
  },
  en: {
    ogImage: "/ogimage-en.png",
    favicon: "/favicon-en.png",
    pdf: "/docs/guide-en.pdf",
  },
} as const;
```

---

## 4. 체크리스트 기준 진단 리포트

### ✅ [ ] UI 텍스트가 한 곳(translation 파일/객체)에 모여 있다.
**상태:** 거의 만족 (70% 완료)
- 대부분의 UI 텍스트는 `app/i18n/uiText.ts`에 모여 있음
- **개선 필요:** 메타데이터, 로딩 메시지 등 일부 하드코딩 텍스트 남아있음
- **수정 필요 파일:** `app/layout.tsx`, `app/page.tsx` (Suspense fallback)

### ✅ [ ] 컴포넌트에서는 `t("...")` 같은 key 기반 접근만으로 텍스트를 사용한다.
**상태:** 거의 만족
- 대부분 `getUIText(key, lang)` 사용
- **개선 필요:** 일부 조건부 분기 (`lang === "en" ? ... : ...`) 남아있지만, 이는 데이터 표시 로직이므로 허용 가능

### ❌ [ ] 언어별 이미지/파일 경로도 translation 또는 config에서 관리한다.
**상태:** 전혀 안 되어 있음
- 모든 리소스가 하드코딩되어 있음
- OG 이미지, 파비콘 등이 언어별로 분리되지 않음
- **수정 필요 파일:** `app/layout.tsx`

### ⚠️ [ ] 새로운 텍스트를 추가할 때 따라야 할 일관된 규칙이 있다.
**상태:** 일부만 구현
- `app/i18n/uiText.ts`에 추가하는 규칙은 있음
- 하지만 문서화되지 않음
- `.cursorrules`에 규칙이 없음

### ✅ [ ] 언어가 추가되더라도 UI 코드 수정 없이 translation만 추가하면 된다.
**상태:** 거의 만족
- `LangCode` 타입에 새 언어 추가 시 타입 에러로 안전하게 처리됨
- `uiText.ts`에 새 언어 추가만 하면 됨
- **주의:** 일부 조건부 분기 (`lang === "en"`)가 있어 완전 자동화는 아님

---

## 5. 개선이 필요하다면, 구체적인 리팩터 플랜 제안

### 1) i18n 샘플 구조 생성

**새 파일 생성: `app/i18n-demo/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { LangCode } from "../types";
import { getUIText } from "../i18n/uiText";

export default function I18nDemoPage() {
  const [lang, setLang] = useState<LangCode>("ko");
  
  return (
    <div className="p-8">
      <h1>i18n Demo</h1>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setLang("ko")}>한국어</button>
        <button onClick={() => setLang("en")}>English</button>
      </div>
      <p>{getUIText("appTitle", lang)}</p>
      <p>{getUIText("appSubtitle", lang)}</p>
    </div>
  );
}
```

### 2) 단계별 리팩터 플랜

#### **1단계: 공통 영역 텍스트 분리 (우선순위: 높음)**
- **대상 파일:**
  - `app/layout.tsx` - 메타데이터 동적 생성
  - `app/page.tsx` - Suspense fallback 메시지
- **작업:**
  ```typescript
  // app/i18n/uiText.ts에 추가
  loading: { ko: "로딩 중...", en: "Loading..." },
  metaTitle: { ko: "로판 아틀리에 – 로맨스 판타지 세계관 이름 생성기", en: "Rofan Atelier – Romance Fantasy Name Generator" },
  metaDescription: { ko: "...", en: "..." },
  ```
- **예상 시간:** 1-2시간

#### **2단계: 리소스 관리 구조 추가 (우선순위: 중간)**
- **새 파일 생성: `app/i18n/resources.ts`**
  ```typescript
  export const RESOURCES = {
    ko: {
      ogImage: "/ogimage.png",  // 현재는 동일, 나중에 분리 가능
      favicon: "/favicon.ico",
    },
    en: {
      ogImage: "/ogimage.png",
      favicon: "/favicon.ico",
    },
  } as const;
  ```
- **`app/layout.tsx` 수정:**
  - `generateMetadata()` 함수로 동적 메타데이터 생성
  - `RESOURCES[lang]` 사용
- **예상 시간:** 2-3시간

#### **3단계: 네임스페이스 구조 도입 (우선순위: 낮음, 선택사항)**
- **현재:** 평면적 구조 (`appTitle`, `cultureLabel` 등)
- **제안:** 계층적 구조
  ```typescript
  const UI_TEXT = {
    common: {
      loading: { ko: "로딩 중...", en: "Loading..." },
      error: { ko: "오류", en: "Error" },
    },
    pages: {
      home: {
        title: { ko: "로판 아틀리에", en: "Rofan Atelier" },
      },
    },
    forms: {
      culture: { ko: "문화권", en: "Culture" },
    },
  };
  ```
- **예상 시간:** 4-6시간 (전체 리팩터)

#### **4단계: 남아 있는 하드코딩 텍스트 검색 및 정리**
- **검색 명령어:**
  ```bash
  grep -r "['\"][가-힣]" app/ --exclude-dir=node_modules
  ```
- **예상 시간:** 2-3시간

### 3) `.cursorrules` 추가 규칙

```markdown
## i18n 규칙

1. **새로운 UI 텍스트 추가 시:**
   - 반드시 `app/i18n/uiText.ts`에 먼저 key를 정의
   - 컴포넌트에서는 `getUIText(key, lang)` 사용
   - 하드코딩된 한국어/영어 문자열 금지

2. **언어별 리소스 추가 시:**
   - `app/i18n/resources.ts`에 정의
   - 이미지, PDF, 링크 등 모든 언어별 리소스 포함

3. **조건부 분기 금지:**
   - `lang === "ko" ? "한국어" : "English"` 같은 패턴 금지
   - 반드시 translation 파일 사용

4. **타입 안전성:**
   - `UITextKey` 타입 사용으로 오타 방지
   - 새 언어 추가 시 `LangCode` 타입에 먼저 추가

5. **메타데이터:**
   - `layout.tsx`의 메타데이터는 `generateMetadata()`로 동적 생성
   - 현재 언어에 따라 다른 메타데이터 제공
```

---

## 6. 요약

### 현재 로판월드의 i18n 성숙도

로판월드는 **커스텀 i18n 구조**를 사용하고 있으며, 대부분의 UI 텍스트(약 70%)가 `app/i18n/uiText.ts`에 중앙 집중식으로 관리되고 있습니다. `getUIText(key, lang)` 함수를 통한 key 기반 접근이 일관되게 적용되어 있어, 새로운 언어 추가 시에도 UI 코드 수정 없이 translation 파일만 확장하면 됩니다. 다만 메타데이터와 리소스 관리 부분은 아직 하드코딩되어 있어, SEO와 다국어 리소스 관리 측면에서 개선이 필요합니다.

### 점수: **7/10**

**강점:**
- ✅ 커스텀 구조로 외부 의존성 없음
- ✅ TypeScript 타입 안전성
- ✅ 대부분의 UI 텍스트가 중앙 관리됨
- ✅ 언어 추가가 용이한 구조

**약점:**
- ❌ 메타데이터 하드코딩
- ❌ 리소스(이미지 등) i18n 미구현
- ❌ 네임스페이스 구조 없음 (확장성 제한)
- ❌ 문서화된 규칙 부재

### 지금 당장 손대면 '효율 대비 효과'가 가장 큰 영역

1. **메타데이터 동적 생성 (우선순위: 최고)**
   - SEO에 직접 영향
   - `app/layout.tsx`의 `generateMetadata()` 구현
   - 예상 시간: 1-2시간, 효과: 높음

2. **로딩/에러 메시지 translation 추가 (우선순위: 높음)**
   - 사용자 경험 개선
   - `app/page.tsx`, 기타 컴포넌트의 하드코딩 메시지 정리
   - 예상 시간: 1시간, 효과: 중간

3. **리소스 관리 구조 추가 (우선순위: 중간)**
   - 향후 언어별 리소스 분리 대비
   - `app/i18n/resources.ts` 생성 및 `layout.tsx` 수정
   - 예상 시간: 2-3시간, 효과: 중간 (현재는 단일 리소스 사용 중)

---

**보고서 작성일:** 2024년
**프로젝트:** rofan-atelier (로판월드)
**분석 범위:** `app/` 디렉토리 전체


