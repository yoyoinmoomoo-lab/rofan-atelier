# Rofan Visualboard 아키텍처 리뷰 문서

> 작성일: 2025-01-XX  
> 목적: 현재 구현 상태 분석 및 향후 설계 준비

---

## 목차

1. [시스템 전체 개요](#1-시스템-전체-개요)
2. [주요 컴포넌트 & 책임 정리](#2-주요-컴포넌트--책임-정리)
3. [핵심 플로우별 동작 정리](#3-핵심-플로우별-동작-정리)
4. [코드 리뷰 & 리스크/기술 부채 정리](#4-코드-리뷰--리스크기술-부채-정리)
5. [향후 설계 제안](#5-향후-설계-제안)

---

## 1. 시스템 전체 개요

Rofan Visualboard 시스템은 **세 개의 독립적인 영역**으로 구성되어 있습니다.

### 1-1. 세 상자 구조

```
┌─────────────────────────────────────────────────────────────┐
│  [1] rofan.ai (타사 사이트)                                  │
│  ─────────────────────────────────────────────────────────  │
│  • 역할: 사용자가 AI와 채팅하는 웹사이트                     │
│  • 제어 범위: 없음 (우리가 수정할 수 없음)                   │
│  • 데이터 흐름: DOM 구조를 통한 텍스트 추출만 가능          │
│  • 특징:                                                      │
│    - div.mt-5 구조로 채팅 턴 표시                            │
│    - 프롤로그는 div[style*="line-height: 1.5rem"] 구조      │
│    - MutationObserver로 DOM 변경 감지 가능                   │
└─────────────────────────────────────────────────────────────┘
                            ↓ (DOM 읽기)
┌─────────────────────────────────────────────────────────────┐
│  [2] Chrome Extension                                        │
│  ─────────────────────────────────────────────────────────  │
│  • 역할: rofan.ai와 rofan.world 사이의 브릿지               │
│  • 제어 범위: 완전 제어 가능                                  │
│  • 구성 요소:                                                 │
│    - content.js: rofan.ai 페이지에 주입, DOM 읽기            │
│    - service-worker.js: 메시지 라우팅                        │
│    - sidepanel.html/js: UI 및 iframe 관리                    │
│  • 데이터 흐름:                                               │
│    - content.js → service-worker → sidepanel                │
│    - sidepanel → iframe (postMessage)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓ (postMessage)
┌─────────────────────────────────────────────────────────────┐
│  [3] rofan.world (Next.js Visualboard)                       │
│  ─────────────────────────────────────────────────────────  │
│  • 역할: 무대 시각화 및 상태 관리                             │
│  • 제어 범위: 완전 제어 가능                                  │
│  • 구성 요소:                                                 │
│    - /app/test-board/page.tsx: iframe 진입점                 │
│    - VisualBoard.tsx: 메인 컴포넌트                          │
│    - PixelStage.tsx: 무대 렌더링                             │
│    - /api/analyze-chat: 텍스트 분석 API                      │
│  • 데이터 흐름:                                               │
│    - postMessage 수신 → state 업데이트                       │
│    - localStorage 저장/복원                                  │
└─────────────────────────────────────────────────────────────┘
```

### 1-2. End-to-End 플로우

#### 시나리오 A: "최근 턴 분석하기" 버튼 클릭

```
[사용자] rofan.ai에서 채팅 중
    ↓
[사용자] Chrome Extension 사이드패널 열기
    ↓
[사용자] "최근 턴 분석하기" 버튼 클릭
    ↓
[sidepanel.js] chrome.runtime.sendMessage({ type: 'REQUEST_LAST_AI_MESSAGE' })
    ↓
[service-worker.js] 활성 탭 확인 → content.js로 메시지 전달
    ↓
[content.js] extractLastAiMessageFromRofanAi() 실행
    ↓
[content.js] getScenarioKeyFromLocation() 실행
    ↓
[content.js] sendResponse({ text, scenarioKey, ... })
    ↓
[sidepanel.js] analyzeTextAndUpdateBoard() 호출
    ↓
[sidepanel.js] fetch('https://rofan.world/api/analyze-chat', {
      body: { chatText, previousState: currentStoryState }
    })
    ↓
[/api/analyze-chat] OpenAI API 호출 → StoryState 생성
    ↓
[sidepanel.js] postStoryStateToIframe({ 
      type: 'STORY_STATE_UPDATE',
      state, 
      scenarioKey 
    })
    ↓
[test-board/page.tsx] window.addEventListener('message') 수신
    ↓
[VisualBoard.tsx] state prop 업데이트 → 무대 렌더링
```

#### 시나리오 B: 자동 업데이트 (새 AI 턴 감지)

```
[사용자] rofan.ai에서 새 AI 답변 입력 대기
    ↓
[rofan.ai] DOM에 새 div.mt-5 추가
    ↓
[content.js] MutationObserver 감지 (500ms 디바운스)
    ↓
[content.js] handleAutoUpdateTurn() 실행
    ↓
[content.js] chrome.runtime.sendMessage({ 
      type: 'NEW_LAST_AI_TURN',
      text, 
      scenarioKey 
    })
    ↓
[service-worker.js] windowId 포함하여 브로드캐스트
    ↓
[sidepanel.js] NEW_LAST_AI_TURN 수신
    ↓
[sidepanel.js] 자동 업데이트 토글 체크 → provider 체크 → windowId 체크
    ↓
[sidepanel.js] analyzeTextAndUpdateBoard() 호출 (조용히, 토스트 없음)
    ↓
[이하 시나리오 A와 동일]
```

---

## 2. 주요 컴포넌트 & 책임 정리

### 2-1. Extension 쪽

| 파일/컴포넌트 | 입력 | 처리 | 출력 |
|--------------|------|------|------|
| **manifest.json** | - | Extension 설정 정의 | - |
| | | • content_scripts: content.js 주입 대상<br>• side_panel: sidepanel.html 경로<br>• host_permissions: rofan.ai, rofan.world | |
| **content.js** | DOM (rofan.ai 페이지) | • 마지막 AI 메시지 추출<br>• scenarioKey 계산<br>• MutationObserver로 새 턴 감지 | • REQUEST_LAST_AI_MESSAGE 응답<br>• NEW_LAST_AI_TURN 메시지 전송 |
| | | **핵심 함수:**<br>- `extractLastAiMessageFromRofanAi()`: div.mt-5 또는 프롤로그에서 텍스트 추출<br>- `getScenarioKeyFromLocation()`: URL에서 시나리오 키 생성 (`https://rofan.ai/chat/xxx` 형태)<br>- `handleAutoUpdateTurn()`: MutationObserver 콜백 | |
| **service-worker.js** | chrome.runtime 메시지 | • 메시지 라우팅<br>• 활성 탭 확인<br>• windowId 추출 및 브로드캐스트 | • content.js ↔ sidepanel.js 메시지 전달 |
| | | **핵심 함수:**<br>- `getActiveRofanChatTab()`: 활성 rofan.ai 채팅 탭 찾기<br>- `handleRequestLastAiMessage()`: content.js로 메시지 전달 | |
| **sidepanel.html** | - | UI 구조 정의 | - |
| | | • Provider 선택 드롭다운<br>• 자동 업데이트 토글<br>• "최근 턴 분석하기" 버튼<br>• iframe (rofan.world/test-board?embed=1) | |
| **sidepanel.js** | chrome.runtime 메시지<br>iframe postMessage | • 상태 관리 (currentStoryState, currentScenarioKey)<br>• API 호출 (/api/analyze-chat)<br>• iframe으로 STORY_STATE_UPDATE 전송<br>• 중복 분석 방지 | • postMessage로 iframe에 state 전달 |
| | | **핵심 변수:**<br>- `currentStoryState`: 현재 세계 상태<br>- `currentScenarioKey`: 현재 시나리오 키<br>- `lastAnalyzed`: 중복 분석 방지용 키<br>- `autoUpdateEnabled`: 자동 업데이트 토글 상태 | |
| | | **핵심 함수:**<br>- `analyzeTextAndUpdateBoard()`: 텍스트 분석 및 보드 업데이트<br>- `postStoryStateToIframe()`: iframe으로 state 전송 (중복 체크 포함)<br>- `handleScenarioChange()`: 시나리오 변경 시 상태 초기화 | |

### 2-2. rofan.world 쪽

| 파일/컴포넌트 | 입력 | 처리 | 출력 |
|--------------|------|------|------|
| **/app/test-board/page.tsx** | postMessage 이벤트 | • embed 모드 감지 (`?embed=1`)<br>• STORY_STATE_UPDATE 수신<br>• RESET_STORY_STATE 수신 | • VisualBoard 컴포넌트 렌더링<br>• state, scenarioKey prop 전달 |
| | | **핵심 로직:**<br>- `sender === "visualboard-sidepanel"` 필터링<br>- `disableRestore={isEmbed}`: Extension 모드에서는 복구 비활성화 | |
| **VisualBoard.tsx** | state (StoryState)<br>scenarioKey (string)<br>disableRestore (boolean) | • 시나리오별 캐스트 관리 (castByScenario)<br>• localStorage 저장/복원<br>• PixelStage, CharacterStatusPanel, BackstageCastPanel 렌더링 | • 무대 시각화<br>• 캐스트 정보 저장 |
| | | **핵심 로직:**<br>- **캐스트 저장:** `rofan-visualboard-cast::${scenarioKey}`<br>- **무대 상태 저장:** `rofan-visualboard-state::${scenarioKey}`<br>- **복원:** `disableRestore === false`일 때만 localStorage에서 복원<br>- **캐스트 merge:** `buildMergedCastFromStory()` - 새 캐릭터만 추가, 기존 캐릭터 유지 | |
| **PixelStage.tsx** | state, characters (gender 포함) | • 배경 색상 결정 (장면 타입 기반)<br>• 캐릭터 이모지 렌더링 (성별 + 감정)<br>• 무대 레이아웃 (left/center/right) | • 시각적 무대 렌더링 |
| | | **핵심 함수:**<br>- `getSceneBackgroundColor()`: scene.type → 배경 색상<br>- `getCharacterEmoji()`: gender → 이모지<br>- `getMoodEmoji()`: moodState → 감정 이모지 | |
| **CharacterStatusPanel.tsx** | state | • 장면 정보 표시 (location_name, summary)<br>• 캐릭터 상태 표시 (moodState.description) | • 텍스트 패널 렌더링 |
| **BackstageCastPanel.tsx** | storyCharacters, cast | • 무대 위/뒤 캐릭터 분류<br>• 성별 선택 UI 제공 | • 캐스트 관리 UI<br>• onCastChange 콜백 호출 |
| **/api/analyze-chat/route.ts** | chatText (string)<br>previousState (StoryState, 선택) | • OpenAI API 호출<br>• JSON 파싱 및 검증<br>• 재시도 로직 (파싱 실패 시) | • StoryState JSON 응답 |
| | | **핵심 로직:**<br>- `previousState`가 있으면 "업데이트 모드" 프롬프트<br>- `previousState`가 없으면 "새로 생성 모드" 프롬프트<br>- jsonrepair로 JSON 복구 시도<br>- 2회 재시도 (파싱 실패 시) | |

---

## 3. 핵심 플로우별 동작 정리

### 3-1. "최근 턴 분석하기" 버튼 클릭 플로우

#### 단계별 상세 설명

```
1. [사용자 액션]
   - sidepanel.html에서 "최근 턴 분석하기" 버튼 클릭

2. [sidepanel.js - 버튼 핸들러]
   - analyzeButton.addEventListener('click') 실행
   - setButtonLoading(true) - 버튼 비활성화
   - requestLastAiMessageFromContentScript(currentProvider) 호출

3. [sidepanel.js → service-worker.js]
   - chrome.runtime.sendMessage({
       type: 'REQUEST_LAST_AI_MESSAGE',
       provider: 'rofan-ai'
     })

4. [service-worker.js]
   - handleRequestLastAiMessage() 실행
   - getActiveRofanChatTab() - 활성 rofan.ai 채팅 탭 찾기
   - chrome.tabs.sendMessage(tabId, { type: 'REQUEST_LAST_AI_MESSAGE' })

5. [content.js]
   - chrome.runtime.onMessage 리스너 실행
   - isRofanChatPage() 체크
   - extractLastAiMessageFromRofanAi() 실행:
     * div.mt-5 마지막 블록 찾기
     * class="mt-1"인 <p> 우선 선택, 없으면 마지막 <p>
     * 프롤로그 fallback (div.mt-5가 없을 때)
   - getScenarioKeyFromLocation(window.location) 실행:
     * URL에서 `https://rofan.ai/chat/xxx` 형태 추출
   - sendResponse({ 
       success: true,
       text: "...",
       scenarioKey: "https://rofan.ai/chat/xxx",
       provider: 'rofan-ai',
       source: 'last-ai' | 'scenario'
     })

6. [sidepanel.js]
   - requestLastAiMessageFromContentScript() Promise resolve
   - handleScenarioChange(scenarioKey) 실행:
     * 시나리오 변경 감지 시 상태 초기화
     * currentStoryState = null
     * lastAnalyzed = null
   - analyzeTextAndUpdateBoard() 호출:
     * source: 'last-ai'
     * provider: 'rofan-ai'
     * text: 추출된 텍스트
     * scenarioKey: 추출된 시나리오 키

7. [sidepanel.js - 중복 분석 방지]
   - lastAnalyzed 키 생성: { provider, messageId, textHash }
   - 동일 키면 스킵

8. [sidepanel.js → /api/analyze-chat]
   - fetch('https://rofan.world/api/analyze-chat', {
       method: 'POST',
       body: JSON.stringify({
         chatText: text.trim(),
         previousState: currentStoryState  // 이전 상태 전달
       })
     })

9. [/api/analyze-chat]
   - OpenAI API 호출 (previousState 포함 프롬프트)
   - JSON 파싱 및 검증
   - StoryState 반환

10. [sidepanel.js]
    - currentStoryState = newState (전역 상태 갱신)
    - postStoryStateToIframe(storyState, scenarioKey) 실행:
      * 중복 체크 (lastPostedStateHash)
      * throttle 체크 (100ms 이내 재전송 차단)
      * messageId 생성: `sidepanel-${Date.now()}-${counter}`
      * iframe.contentWindow.postMessage({
          sender: 'visualboard-sidepanel',
          type: 'STORY_STATE_UPDATE',
          messageId: '...',
          state: storyState,
          scenarioKey: scenarioKey,
          timestamp: Date.now()
        })

11. [test-board/page.tsx]
    - window.addEventListener('message') 실행
    - sender === 'visualboard-sidepanel' 필터링
    - type === 'STORY_STATE_UPDATE' 처리
    - setState(state)
    - setScenarioKey(scenarioKey)

12. [VisualBoard.tsx]
    - state prop 업데이트
    - useEffect 실행:
      * 캐스트 복원/merge
      * localStorage 저장
    - PixelStage, CharacterStatusPanel, BackstageCastPanel 렌더링

13. [sidepanel.js]
    - onSuccess() 콜백 실행
    - showToast('보드가 업데이트되었습니다.')
    - setButtonLoading(false)
```

#### scenarioKey 생성 위치

- **생성 위치:** `content.js`의 `getScenarioKeyFromLocation()` 함수
- **형태:** `https://rofan.ai/chat/xxx` (origin + pathname)
- **전달 경로:**
  1. content.js → service-worker → sidepanel.js (REQUEST_LAST_AI_MESSAGE 응답)
  2. sidepanel.js → iframe (STORY_STATE_UPDATE 메시지의 scenarioKey 필드)

### 3-2. 자동 업데이트(새 AI 턴 감지) 플로우

#### MutationObserver 설정

```
[content.js - 초기화]
- window.location.host === 'rofan.ai' 체크
- checkLocationAndSetupObserver() 실행
- setInterval(1000ms)로 location.href 감시
- isRofanChatPage() 체크
- setupRofanAutoUpdateObserver() 실행:
  * chatRoot = document.querySelector('div.lg\\:pr-5.overflow-y-auto')
  * MutationObserver 생성:
    - observe(chatRoot, { childList: true, subtree: true })
    - 콜백: handleAutoUpdateTurn() (500ms 디바운스)
```

#### 새 턴 감지 조건

```
[조건 1] MutationObserver 콜백 실행
  ↓
[조건 2] 디바운스 타이머 (500ms)
  ↓
[조건 3] extractLastAiMessageFromRofanAi() 성공
  ↓
[조건 4] 이전에 보낸 텍스트와 다름 (lastAutoTurnText !== text)
  ↓
[조건 5] chrome.runtime.sendMessage 가능
  ↓
[조건 6] NEW_LAST_AI_TURN 메시지 전송
```

#### sidepanel.js에서의 필터링

```
[NEW_LAST_AI_TURN 수신]
  ↓
[필터 1] sourceWindowId가 없으면 무시 (content.js에서 직접 온 1차 메시지)
  ↓
[필터 2] provider !== 'rofan-ai'면 무시
  ↓
[필터 3] autoUpdateEnabled === false면 무시
  ↓
[필터 4] sourceWindowId !== currentWindowId면 무시 (다른 창)
  ↓
[필터 5] handleScenarioChange(scenarioKey) - 시나리오 변경 감지
  ↓
[분석 실행] analyzeTextAndUpdateBoard({ source: 'auto', ... })
  - 토스트 없음 (조용히 처리)
```

### 3-3. 시나리오별 state/캐스트 저장 & 복원

#### localStorage 키 구조

```
무대 상태: rofan-visualboard-state::${scenarioKey}
캐스트:    rofan-visualboard-cast::${scenarioKey}

예시:
- rofan-visualboard-state::https://rofan.ai/chat/abc123
- rofan-visualboard-cast::https://rofan.ai/chat/abc123
```

#### 저장 로직 (VisualBoard.tsx)

```
[무대 상태 저장]
- useEffect([scenarioKey, state])
- 조건: scenarioKey && state && window !== undefined
- 중복 저장 방지: lastSavedStateRef.current[scenarioKeySafe] === stateString
- 저장: localStorage.setItem(`rofan-visualboard-state::${scenarioKey}`, JSON.stringify(state))

[캐스트 저장]
- useEffect([castByScenario, scenarioKey, state])
- 조건: scenarioKey && state && window !== undefined
- 저장: localStorage.setItem(`rofan-visualboard-cast::${scenarioKey}`, JSON.stringify(current))
```

#### 복원 로직 (VisualBoard.tsx)

```
[무대 상태 복원]
- useEffect([scenarioKey, onStateRestore, disableRestore])
- 조건:
  * disableRestore === false (Extension 모드에서는 비활성화)
  * scenarioKey 존재
  * hasLoadedStateRef.current[scenarioKeySafe] === false (최초 1회만)
- 복원: localStorage.getItem(`rofan-visualboard-state::${scenarioKey}`)
- 콜백: onStateRestore(parsed)

[캐스트 복원]
- useEffect([state, scenarioKey, scenarioKeySafe])
- 조건: state && !prevCastForScenario && scenarioKey
- 복원: localStorage.getItem(`rofan-visualboard-cast::${scenarioKey}`)
- merge: buildMergedCastFromStory(loadedCast, state)
```

#### embed 모드 vs 일반 모드 차이

| 항목 | embed 모드 (Extension) | 일반 모드 (직접 접근) |
|------|----------------------|---------------------|
| **무대 상태 복원** | ❌ 비활성화 (`disableRestore={true}`) | ✅ 활성화 |
| **이유** | Extension이 보낸 데이터가 "진실의 원천" | 사용자가 직접 입력한 텍스트 분석 |
| **캐스트 복원** | ✅ 활성화 (동일) | ✅ 활성화 |
| **이유** | 캐스트는 사용자가 수동으로 설정한 정보이므로 복원 필요 | 동일 |

#### disableRestore 플래그의 역할

- **목적:** Extension 모드에서 localStorage 복원과 Extension이 보낸 최신 데이터 간 충돌 방지
- **설정 위치:** `test-board/page.tsx`에서 `disableRestore={isEmbed}`로 전달
- **동작:**
  - `disableRestore === true`: 무대 상태 복원 스킵 (Extension 데이터 우선)
  - `disableRestore === false`: localStorage에서 복원 시도

---

## 4. 코드 리뷰 & 리스크/기술 부채 정리

### 4-1. 상태 관리 / 동기화 리스크

#### 현재 상황 요약

- **VisualBoard.tsx**에서 `state`, `castByScenario`, `scenarioKey`를 함께 관리
- localStorage 저장/복원이 여러 `useEffect`에 분산
- Extension 모드와 일반 모드에서 복원 로직이 다름

#### 문제가 될 수 있는 포인트

1. **레이스 컨디션 가능성**
   - 시나리오 A: Extension이 `STORY_STATE_UPDATE`를 보내는 중
   - 시나리오 B: localStorage 복원이 동시에 실행됨
   - 결과: 복원된 오래된 state가 Extension의 최신 state를 덮어쓸 수 있음
   - **현재 완화 조치:** `disableRestore={isEmbed}`로 Extension 모드에서는 복원 비활성화

2. **캐스트 merge 로직의 복잡성**
   - `buildMergedCastFromStory()`는 "새 캐릭터만 추가, 기존 캐릭터 유지"
   - 문제: API가 반환한 `state.characters`에 없는 캐릭터도 캐스트에 남아있음
   - 예시: 이전 턴에 등장했던 캐릭터가 이번 턴에 없어도 캐스트에는 유지됨
   - **의도된 동작인지 확인 필요**

3. **scenarioKey 변경 시 상태 초기화 타이밍**
   - `handleScenarioChange()`에서 `currentStoryState = null`로 초기화
   - 하지만 `VisualBoard.tsx`의 복원 로직은 별도 `useEffect`에서 실행
   - 시나리오 변경 직후 복원이 실행되면 이전 시나리오의 state가 잠깐 보일 수 있음

#### 나중에 리팩토링할 때의 아이디어

1. **상태 관리 라이브러리 도입 검토**
   - Zustand 또는 Jotai 같은 경량 상태 관리 라이브러리
   - 시나리오별 상태를 명시적으로 관리

2. **복원 로직 통합**
   - `disableRestore` 플래그를 더 명확하게 처리
   - Extension 모드에서는 복원을 완전히 스킵하도록 보장

3. **캐스트 관리 정책 명확화**
   - "무대에 등장한 캐릭터만 캐스트에 유지" vs "한 번 등장한 캐릭터는 계속 유지"
   - 정책에 따라 merge 로직 수정

### 4-2. 메시지 프로토콜

#### 현재 상황 요약

- `postMessage`로 주고받는 payload 구조:
  ```typescript
  {
    sender: 'visualboard-sidepanel' | 'test-board',
    type: 'STORY_STATE_UPDATE' | 'RESET_STORY_STATE',
    messageId: string,
    state?: StoryState,
    scenarioKey?: string,
    timestamp?: number
  }
  ```

#### 문제가 될 수 있는 포인트

1. **타입 안전성 부족**
   - `postMessage`는 `any` 타입으로 처리됨
   - TypeScript 컴파일 타임 체크 불가

2. **버전 관리 없음**
   - payload 구조가 변경되면 기존 Extension과 호환성 깨짐
   - 예: `scenarioKey` 필드가 추가되면 이전 버전 Extension은 처리 불가

3. **무한 루프 방지 로직의 복잡성**
   - `sidepanel.js`에서 여러 필터로 무한 루프 방지:
     * sender 필터
     * scenarioKey 필터
     * 중복 state 필터
   - 하지만 필터 로직이 분산되어 있어 유지보수 어려움

#### 나중에 리팩토링할 때의 아이디어

1. **명시적인 프로토콜 버전 관리**
   ```typescript
   interface VisualboardMessage {
     protocolVersion: '1.0',
     sender: string,
     type: string,
     payload: unknown
   }
   ```

2. **타입 안전한 메시지 핸들러**
   - Zod 같은 스키마 검증 라이브러리 도입
   - 런타임 타입 체크

3. **메시지 라우터 패턴**
   - 중앙화된 메시지 라우터로 필터링 로직 통합

### 4-3. 에러 처리 / 방어 코드

#### 현재 상황 요약

- `/api/analyze-chat`에서 재시도 로직 구현 (파싱 실패 시 2회 시도)
- Extension 쪽에서는 기본적인 에러 핸들링만 존재

#### 문제가 될 수 있는 포인트

1. **API 실패 시 사용자 경험**
   - Extension 모드: 토스트 메시지 표시 (`showToast('업데이트에 실패했습니다.')`)
   - 자동 업데이트 모드: 조용히 실패 (토스트 없음)
   - 문제: 사용자가 실패를 인지하지 못할 수 있음

2. **네트워크 오류 처리**
   - `fetch()` 실패 시 `catch` 블록에서만 처리
   - 재시도 로직 없음 (API 서버 측 재시도만 존재)

3. **content.js의 DOM 구조 변경 대응**
   - `extractLastAiMessageFromRofanAi()`가 특정 DOM 구조에 의존
   - rofan.ai가 구조를 변경하면 추출 실패
   - 현재: `console.warn`만 출력하고 실패 처리

#### 나중에 리팩토링할 때의 아이디어

1. **에러 복구 전략 명확화**
   - 네트워크 오류: 자동 재시도 (exponential backoff)
   - 파싱 오류: 사용자에게 알림 + 수동 재시도 버튼
   - DOM 구조 변경: Fallback 추출 로직 추가

2. **에러 로깅 및 모니터링**
   - Sentry 같은 에러 트래킹 도구 도입
   - 사용자 동의 하에 에러 리포트 수집

### 4-4. 퍼포먼스/불필요 리렌더링 가능성

#### 현재 상황 요약

- `VisualBoard.tsx`에서 여러 `useEffect`가 `state`, `scenarioKey`를 의존성으로 사용
- localStorage 읽기/쓰기가 `useEffect` 내부에서 실행

#### 문제가 될 수 있는 포인트

1. **localStorage I/O 빈도**
   - `state`가 변경될 때마다 저장 시도
   - `lastSavedStateRef`로 중복 저장 방지하지만, JSON.stringify는 매번 실행됨
   - 큰 state 객체의 경우 성능 저하 가능

2. **캐스트 merge 로직의 반복 실행**
   - `useEffect([state, scenarioKey, scenarioKeySafe])`에서 매번 실행
   - `buildMergedCastFromStory()`는 비교적 가벼우나, 불필요한 실행 가능

3. **PixelStage 리렌더링**
   - `characters` prop이 변경될 때마다 전체 무대 리렌더링
   - React.memo로 최적화 가능하지만 현재 미적용

#### 나중에 리팩토링할 때의 아이디어

1. **localStorage 쓰기 디바운싱**
   - `useDebouncedCallback` 같은 훅으로 저장 지연
   - 예: 500ms 이내 변경이 없을 때만 저장

2. **React.memo 적용**
   - `PixelStage`, `CharacterStatusPanel` 등에 memo 적용
   - props 변경 시에만 리렌더링

3. **useMemo로 계산 결과 캐싱**
   - `buildMergedCastFromStory()` 결과를 `useMemo`로 캐싱

---

## 5. 향후 설계 제안

### 5-1. 무대 저장 & 자동 복원 강화

#### 목표

- 같은 `scenarioKey`로 다시 돌아왔을 때 마지막 무대 상태 자동 복원
- Extension 모드에서는 Extension이 보낸 최신 데이터가 우선

#### Step 1: 시나리오별 마지막 무대 상태 저장 & 복원 규칙 정리

**현재 구조:**
- 저장: `VisualBoard.tsx`의 `useEffect([scenarioKey, state])`에서 자동 저장
- 복원: `useEffect([scenarioKey, onStateRestore, disableRestore])`에서 복원 (일반 모드만)

**개선 방향:**

1. **복원 타이밍 명확화**
   - Extension 모드: Extension이 `STORY_STATE_UPDATE`를 보내기 전에 복원하지 않음
   - 일반 모드: 컴포넌트 마운트 시 즉시 복원

2. **복원 우선순위**
   ```
   Extension 모드:
   1순위: Extension이 보낸 STORY_STATE_UPDATE
   2순위: (복원 없음)
   
   일반 모드:
   1순위: 사용자가 입력한 텍스트 분석 결과
   2순위: localStorage 복원 (분석 결과가 없을 때)
   ```

**수정이 필요한 파일:**
- `app/components/visualboard/VisualBoard.tsx`
  - 복원 로직 개선
  - Extension 모드에서 복원 완전 스킵 보장

**데이터 흐름 변경:**
- 현재: `disableRestore` 플래그로 복원 스킵
- 개선: Extension 모드에서는 복원을 아예 시도하지 않도록 조건 강화

**주의사항:**
- Extension이 `STORY_STATE_UPDATE`를 보내기 전에 복원이 실행되면 안 됨
- `test-board/page.tsx`에서 `disableRestore={isEmbed}` 전달은 유지

#### Step 2: Extension 모드에서의 복원 정책 결정

**선택지:**

**A안: Extension 모드에서 완전히 복원 비활성화 (현재 방식)**
- 장점: Extension 데이터가 항상 우선, 충돌 없음
- 단점: Extension을 닫았다가 다시 열면 이전 상태가 사라짐

**B안: Extension 모드에서도 복원하되, Extension 데이터가 오면 덮어쓰기**
- 장점: Extension을 다시 열었을 때 이전 상태 유지
- 단점: 복원된 상태와 Extension 데이터 간 충돌 가능성

**추천: A안 유지 + 향후 B안으로 전환 검토**

**이유:**
- 현재는 Extension이 항상 최신 데이터를 보내므로 A안이 안전
- 향후 "Extension을 닫았다가 다시 열었을 때 이전 상태 유지" 기능이 필요하면 B안으로 전환

### 5-2. 캐릭터 세트(캐스트) 저장 & 활용

#### 목표

- 시나리오마다 고정된 "캐스트" 리스트 관리
- 캐릭터의 기본 정보 (이름, 성, 호칭, 성별, 역할) 저장
- 무대 위 캐릭터는 캐스트를 참조하여 렌더링

#### Step 1: 캐스트 스키마(타입) 정의 & 저장 위치 결정

**현재 구조:**
```typescript
type BackstageCastEntry = {
  name: string;
  gender: Gender;
};
```

**개선 방향:**

```typescript
type BackstageCastEntry = {
  // 기본 정보
  canonicalName: string;        // 정식 이름 (예: "페스텔 메비헤르")
  aliases: string[];             // 별칭/호칭 목록 (예: ["페스텔", "페스텔 황태자", "메비헤르 경"])
  gender: Gender;
  
  // 선택적 정보
  familyName?: string;           // 성 (예: "메비헤르")
  title?: string;                // 직함 (예: "황태자")
  role?: string;                 // 역할 (예: "주인공", "남주")
  
  // 메타데이터
  firstAppeared?: string;        // 첫 등장 시나리오 키
  notes?: string;                // 사용자 메모
};
```

**저장 위치:**
- localStorage: `rofan-visualboard-cast::${scenarioKey}` (현재와 동일)
- 향후: 서버 동기화 고려 (선택적)

**수정이 필요한 파일:**
- `app/components/visualboard/VisualBoard.tsx`
  - `BackstageCastEntry` 타입 확장
  - `buildMergedCastFromStory()` 로직 수정
- `app/components/visualboard/BackstageCastPanel.tsx`
  - UI에 alias, title 등 표시
  - 편집 기능 추가 (향후)

**데이터 흐름 변경:**
- 현재: `state.characters`의 `name`을 그대로 사용
- 개선: `state.characters`의 `name`을 `aliases`와 매칭하여 `canonicalName` 찾기

**주의사항:**
- 기존 localStorage 데이터와의 호환성 유지
- 마이그레이션 로직 필요 (기존 `name` → `canonicalName` 변환)

#### Step 2: 이름/호칭/성 규칙을 위한 alias/키 구조 설계

**문제 상황:**
- `페스텔 메비헤르`라는 캐릭터가 텍스트에서 `페스텔`, `페스텔 황태자`, `메비헤르 경` 등으로 등장
- `야닉 웨틀링겔`, `릴리아나 웨틀링겔`, `웨틀링겔 공작` 같은 성 공유
- `"황제"`, `"황후"`처럼 이름 없이 직함만 나오는 캐릭터

**설계 제안:**

**A안: canonicalName + aliases 배열 구조 (추천)**

```typescript
{
  canonicalName: "페스텔 메비헤르",
  aliases: ["페스텔", "페스텔 황태자", "페스텔 전하", "메비헤르 경"],
  familyName: "메비헤르",
  title: "황태자"
}
```

**장점:**
- 유연함: 다양한 호칭을 aliases에 추가 가능
- 확장성: 향후 자동 alias 추출 기능 추가 가능

**단점:**
- 초기 설정이 수동으로 필요 (사용자가 aliases 입력)

**B안: 이름 파싱 규칙 기반 구조**

```typescript
{
  canonicalName: "페스텔 메비헤르",
  firstName: "페스텔",
  lastName: "메비헤르",
  title: "황태자",
  // 자동 생성: aliases = [firstName, `${firstName} ${title}`, `${lastName} 경`]
}
```

**장점:**
- 자동화 가능: 이름 구조에서 자동으로 alias 생성
- 규칙 기반: 일관된 alias 생성

**단점:**
- 복잡한 이름 구조에 대응 어려움
- 한국어 이름의 경우 성/이름 구분이 모호함

**추천: A안 (canonicalName + aliases)**

**이유:**
- 로맨스 판타지 소설의 캐릭터 이름은 다양하고 불규칙함
- 사용자가 직접 alias를 관리하는 것이 가장 정확함
- 향후 AI 기반 alias 추출 기능 추가 가능

**매칭 로직:**

```typescript
function findCharacterByAlias(
  cast: BackstageCastEntry[],
  nameFromText: string
): BackstageCastEntry | null {
  for (const entry of cast) {
    // 정식 이름 매칭
    if (entry.canonicalName === nameFromText) {
      return entry;
    }
    // alias 매칭
    if (entry.aliases.includes(nameFromText)) {
      return entry;
    }
    // 부분 매칭 (예: "페스텔"이 "페스텔 메비헤르"에 포함)
    if (entry.canonicalName.includes(nameFromText) || 
        nameFromText.includes(entry.canonicalName.split(' ')[0])) {
      return entry;
    }
  }
  return null;
}
```

**수정이 필요한 파일:**
- `app/components/visualboard/VisualBoard.tsx`
  - `findCharacterByAlias()` 함수 추가
  - `buildMergedCastFromStory()`에서 alias 기반 매칭
- `app/components/visualboard/BackstageCastPanel.tsx`
  - alias 편집 UI 추가 (향후)

**주의사항:**
- 매칭 우선순위: 정식 이름 > alias > 부분 매칭
- 모호한 경우: 사용자에게 확인 요청 (향후)

#### Step 3: `/api/analyze-chat`에 캐스트/alias 힌트 전달 여부 검토

**선택지:**

**A안: API에 캐스트 정보 전달 (추천)**

```typescript
// sidepanel.js 또는 test-board/page.tsx에서
fetch('/api/analyze-chat', {
  body: JSON.stringify({
    chatText: text,
    previousState: currentStoryState,
    castHints: currentCast  // 새 필드 추가
  })
})
```

**장점:**
- API가 캐스트 정보를 알고 있으면 더 정확한 이름 매칭 가능
- 예: "황제"라는 직함만 나와도 캐스트에서 "황제" 직함을 가진 캐릭터 찾기 가능

**단점:**
- API 프롬프트가 복잡해짐
- 캐스트 정보가 없어도 동작해야 함 (하위 호환성)

**B안: API는 그대로 두고 클라이언트에서만 매칭**

**장점:**
- API 변경 없음
- 클라이언트에서 유연하게 처리 가능

**단점:**
- API가 반환한 `state.characters`의 이름이 alias일 수 있음
- 클라이언트에서 매칭 실패 시 새 캐릭터로 인식

**추천: A안 (API에 캐스트 힌트 전달)**

**이유:**
- API가 캐스트 정보를 알고 있으면 더 정확한 분석 가능
- 예: "황제"라는 직함만 나와도 캐스트에서 매칭하여 정식 이름 반환 가능

**구현 단계:**

1. **타입 정의 확장**
   ```typescript
   // app/types.ts
   export interface AnalyzeChatRequest {
     chatText: string;
     previousState?: StoryState;
     castHints?: Array<{
       canonicalName: string;
       aliases: string[];
       gender?: Gender;
       title?: string;
     }>;
   }
   ```

2. **API 프롬프트 수정**
   - `castHints`가 있으면 프롬프트에 포함
   - "다음 캐스트 정보를 참고하여 캐릭터 이름을 정확히 매칭하라" 지시

3. **클라이언트에서 캐스트 전달**
   - `sidepanel.js`: `currentCast`를 `castHints`로 전달
   - `test-board/page.tsx`: localStorage에서 캐스트 로드하여 전달

**수정이 필요한 파일:**
- `app/types.ts`: `AnalyzeChatRequest` 타입 확장
- `app/api/analyze-chat/route.ts`: 프롬프트에 `castHints` 포함
- `Rofan Visualboard/sidepanel.js`: `analyzeTextAndUpdateBoard()`에서 `castHints` 전달
- `app/test-board/page.tsx`: `handleAnalyze()`에서 `castHints` 전달

**주의사항:**
- `castHints`는 선택적 필드 (하위 호환성)
- API가 `castHints`를 무시하고 분석해도 동작해야 함

### 5-3. 구현 우선순위 제안

#### Phase 1: 기반 구조 정리 (우선순위 높음)

1. **캐스트 스키마 확장**
   - `BackstageCastEntry` 타입에 `canonicalName`, `aliases` 추가
   - 기존 데이터 마이그레이션 로직

2. **복원 로직 개선**
   - Extension 모드에서 복원 완전 스킵 보장
   - 일반 모드에서 복원 타이밍 명확화

#### Phase 2: 이름 매칭 강화 (우선순위 중간)

3. **alias 기반 매칭 로직**
   - `findCharacterByAlias()` 함수 구현
   - `buildMergedCastFromStory()`에서 alias 매칭 적용

4. **API에 캐스트 힌트 전달**
   - `AnalyzeChatRequest` 타입 확장
   - API 프롬프트 수정
   - 클라이언트에서 캐스트 전달

#### Phase 3: UI 개선 (우선순위 낮음)

5. **캐스트 편집 UI**
   - `BackstageCastPanel`에 alias 편집 기능 추가
   - 직함, 역할 등 추가 정보 입력 UI

6. **자동 alias 추출**
   - AI 기반 alias 추출 기능 (향후)

---

## 문서 요약

### 핵심 아키텍처

- **3상자 구조:** rofan.ai (타사) → Chrome Extension (브릿지) → rofan.world (시각화)
- **데이터 흐름:** DOM 읽기 → 메시지 라우팅 → API 호출 → postMessage → 렌더링
- **상태 관리:** Extension 측 `currentStoryState` + rofan.world 측 localStorage

### 주요 리스크

1. **상태 동기화:** Extension 모드와 일반 모드의 복원 로직 차이
2. **메시지 프로토콜:** 타입 안전성 부족, 버전 관리 없음
3. **에러 처리:** 네트워크 오류 재시도 로직 부족
4. **퍼포먼스:** localStorage I/O 빈도, 불필요한 리렌더링

### 향후 설계 방향

1. **캐스트 스키마 확장:** `canonicalName` + `aliases` 배열 구조
2. **이름 매칭 강화:** alias 기반 매칭 로직
3. **API 개선:** 캐스트 힌트 전달로 분석 정확도 향상

---

**다음 단계:** 이 문서를 기반으로 구체적인 구현 지시문을 요청하시면 됩니다.

