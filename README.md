# 🌹 Rofan World

로맨스 판타지 작가들을 위한 이름 및 가문명 생성 웹앱입니다.

**Current Version: v1.2.1**

Compatible with Vivid Chat v0.2.1+

## 기능

- **이름 생성**: 문화권, 성별, 계급, 시대감에 맞는 캐릭터 이름 생성
- **가문명 생성**: 로판 세계관에 어울리는 가문명 및 성씨 생성
- **복사 기능**: 생성된 이름/가문명을 쉽게 복사
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

## 기술 스택

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI API (gpt-4o-mini)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경변수를 추가하세요:

```env
# OpenAI API Key (이름/가문명 생성용)
OPENAI_API_KEY=your_openai_api_key_here

# Notion API (피드백 기능용)
# NOTION_FEEDBACK_SOURCE 또는 NOTION_FEEDBACK_DB 중 하나만 사용
# 노션 데이터베이스의 Data Source ID를 입력하세요
NOTION_FEEDBACK_SOURCE=your_notion_database_id_here
# 또는
# NOTION_FEEDBACK_DB=your_notion_database_id_here

# Notion API Token
# 노션 통합(Integration)에서 생성한 토큰을 입력하세요
NOTION_TOKEN=your_notion_token_here

# Notion Template ID (피드백 템플릿용)
# 노션 데이터베이스의 템플릿 ID를 입력하세요
NOTION_FEEDBACK_TEMPLATE_ID=your_notion_template_id_here
```

**환경변수 설정 방법:**

1. **프로젝트 루트 디렉토리**에 `.env.local` 파일을 생성하세요
   - 파일 경로: `/Users/sunhapark/프로젝트/rofan-world/.env.local`

2. **OpenAI API Key**:
   - [OpenAI Platform](https://platform.openai.com/api-keys)에서 API 키 생성
   - `OPENAI_API_KEY=sk-...` 형식으로 입력

3. **Notion 설정** (피드백 기능용):
   - 노션에서 통합(Integration) 생성: [Notion Integrations](https://www.notion.so/my-integrations)
   - 통합에 노션 데이터베이스 권한 부여
   - `NOTION_TOKEN`: 통합에서 생성한 토큰 (형식: `secret_...`)
   - `NOTION_FEEDBACK_SOURCE` 또는 `NOTION_FEEDBACK_DB`: 노션 데이터베이스의 Data Source ID
     - 노션 데이터베이스 URL에서 확인 가능 (예: `notion.so/workspace/DATABASE_ID?v=...`)
   - `NOTION_FEEDBACK_TEMPLATE_ID`: 노션 데이터베이스의 템플릿 ID
     - 노션 데이터베이스에서 템플릿을 만들고, 템플릿의 URL에서 ID 확인
     - 또는 기존 템플릿 ID 사용 (예: `2a7670adb05a805cab4fe139106803a5`)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 배포

Vercel에 배포할 때는 Environment Variables에 다음을 추가하세요:
- `OPENAI_API_KEY`
- `NOTION_TOKEN`
- `NOTION_FEEDBACK_SOURCE` 또는 `NOTION_FEEDBACK_DB`
- `NOTION_FEEDBACK_TEMPLATE_ID`

## 프로젝트 구조

```
app/
├── api/
│   ├── generate-names/      # 이름 생성 API
│   └── generate-families/    # 가문명 생성 API
├── components/               # React 컴포넌트
├── types.ts                 # TypeScript 타입 정의
├── constants.ts             # 상수 정의
└── page.tsx                 # 메인 페이지
```
