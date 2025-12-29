# Extension 패키징 가이드

> Production 제출용 zip 생성 절차

---

## 목적

Web Store 제출 시 **localhost 권한이 포함되지 않도록** 안전하게 패키징합니다.

---

## 파일 구조

- `manifest.json`: Production용 (localhost 권한 없음)
- `manifest.dev.json`: Development용 (localhost 권한 포함)
- `scripts/package-prod.sh`: Production zip 생성 스크립트

---

## 패키징 절차

### 방법 1: 스크립트 사용 (권장)

```bash
cd "Vivid Chat"
./scripts/package-prod.sh
```

**자동 검증:**
- ✅ manifest.json에 localhost 문자열 없음 확인
- ✅ host_permissions에 http://localhost 없음 확인
- ✅ zip에 manifest.dev.json 포함 안 됨 확인

**출력:**
- `dist/vivid-chat-prod.zip` 생성

### 방법 2: 수동 패키징

1. **manifest.dev.json을 manifest.json으로 교체하지 않음** (중요!)
2. 필요한 파일만 선택하여 zip 생성:
   - manifest.json ✅
   - sidepanel.html ✅
   - sidepanel.js ✅
   - content.js ✅
   - service-worker.js ✅
   - options.html ✅ (있으면)
   - options.js ✅ (있으면)
   - **manifest.dev.json ❌ (제외)**

3. zip 파일명: `vivid-chat-prod.zip`

---

## 검증 체크리스트

제출 전 반드시 확인:

- [ ] manifest.json에 `localhost` 문자열 없음
- [ ] manifest.json의 host_permissions에 `http://localhost:3001/*` 없음
- [ ] zip 파일에 manifest.dev.json 포함 안 됨
- [ ] zip 파일 크기가 합리적 (예: 100KB 이하)

---

## Development 빌드

로컬 테스트 시:

1. `manifest.dev.json`을 `manifest.json`으로 복사/교체
2. Chrome Extension 로드 (개발자 모드)
3. 또는 `manifest.dev.json`을 직접 로드 (Chrome은 지원)

**주의:** Development 빌드는 Web Store에 제출하지 않습니다.

---

## 문제 해결

### 스크립트 실행 권한 오류

```bash
chmod +x scripts/package-prod.sh
```

### zip에 manifest.dev.json 포함됨

- 스크립트가 자동으로 제외하지만, 수동 패키징 시 주의
- zip 생성 전 manifest.dev.json 삭제 또는 제외

---

## 참고

- Production manifest: `manifest.json`
- Development manifest: `manifest.dev.json` (name에 "(DEV)" 포함, version_name: "dev")

