"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import LanguageSelector from "../components/LanguageSelector";
import { getInitialLang } from "../utils/langUtils";
import type { LangCode } from "../types";
import LoadingFallback from "../components/LoadingFallback";

function PrivacyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 초기 lang 설정: URL > localStorage > 기본값
  const urlLang = searchParams.get("lang");
  const storageLang = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("lang");
  }, []);
  
  const initialLang = useMemo(() => {
    return getInitialLang(urlLang, storageLang);
  }, [urlLang, storageLang]);
  
  const [lang, setLangState] = useState<LangCode>(initialLang);

  // URL 변경 시 lang 동기화
  useEffect(() => {
    const currentUrlLang = searchParams.get("lang");
    const currentStorageLang = typeof window !== "undefined" 
      ? window.localStorage.getItem("lang") 
      : null;
    const newLang = getInitialLang(currentUrlLang, currentStorageLang);
    if (newLang !== lang) {
      setLangState(newLang);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("lang", newLang);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 언어 변경 핸들러
  const setLang = (newLang: LangCode) => {
    setLangState(newLang);
    
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lang", newLang);
      document.cookie = `lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("lang", newLang);
      router.replace(`?${currentParams.toString()}`, { scroll: false });
    }
  };

  // 현재 날짜 (YYYY-MM-DD 형식)
  const currentDate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      {/* 헤더 - 브랜드명 + 언어 선택기 */}
      <header className="border-b border-[var(--card-border)]/30 bg-[var(--card-bg)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Link href="/" className="text-foreground hover:opacity-80 transition-opacity">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold">
                Rofan.world
              </h1>
            </Link>
            <LanguageSelector 
              currentLang={lang} 
              onChange={setLang} 
              currentPage="given"
            />
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* 페이지 제목 */}
        <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-2">
          {lang === "ko" ? "개인정보처리방침" : "Privacy Policy"}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          <em>{lang === "ko" ? `최종 업데이트일: ${currentDate}` : `Last Updated: ${currentDate}`}</em>
        </p>

        {/* Privacy Policy 내용 - 심플한 문서 스타일 */}
        <div className="prose prose-sm max-w-none text-foreground">
          {lang === "ko" ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mt-8 mb-4">Rofan.world 개인정보처리방침</h2>
              
              <p>
                <strong>Rofan.world</strong>(이하 "서비스")는 사용자의 개인정보를 소중하게 생각하며, 관련 법령 및 Chrome 웹 스토어 사용자 데이터 정책을 준수합니다. 본 개인정보처리방침은 rofan.world에서 제공하는 모든 기능 및 Chrome 확장 프로그램(Vivid Chat)이 사용자의 데이터를 어떻게 수집·사용·보호하는지 설명합니다.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-4">1. 수집하는 정보</h3>

              <h4 className="text-lg font-medium mt-6 mb-3">(1) 사용자가 직접 입력한 정보</h4>
              <p>서비스는 사용자가 입력한 텍스트를 처리합니다.</p>
              <p><strong>예:</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>이름 생성기: 키워드, 시대적 배경, 선호 스타일 등</li>
                <li>가문명 생성기: 테마, 문화권, 음운 조건 등</li>
                <li>캐릭터 이름 생성기: 특징, 성별, 분위기 등</li>
              </ul>
              <p className="mt-4">
                <strong>입력된 정보는 사용자의 요청에 따라 이름·가문명을 생성하기 위해서만 일시적으로 처리됩니다.</strong>
              </p>

              <h4 className="text-lg font-medium mt-6 mb-3">(2) Vivid Chat (Chrome Extension) 관련</h4>
              <p>확장 프로그램은 다음 정보를 읽을 수 있습니다:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>사용자가 rofan.ai에서 보고 있는 <strong>채팅 텍스트</strong> 및 <strong>화면에 표시된 정보</strong></li>
                <li>캐릭터 이름, 대사, 지문 등 시각화에 필요한 요소</li>
              </ul>
              <p className="mt-4">해당 정보는:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li><strong>사용자의 브라우저에서 읽힘 (DOM Access)</strong></li>
                <li>분석을 위해 <strong>rofan.world 서버로 전송</strong></li>
                <li>rofan.world 서버는 이를 <strong>OpenAI API로 전달하여 분석 결과(JSON)</strong>를 생성</li>
                <li>분석 결과만 다시 브라우저로 돌아옵니다.</li>
              </ol>

              <h3 className="text-xl font-semibold mt-8 mb-4">2. 정보의 사용 목적</h3>
              <p>수집된 정보는 아래 목적에 한정하여 사용합니다.</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>사용자 입력 기반 콘텐츠 생성 (이름, 가문명 등)</li>
                <li>Vivid Chat의 <strong>장면 분석·시각화</strong></li>
                <li>서비스 품질 향상 및 오류 분석</li>
                <li>Local Storage 기반의 시각화 상태 유지 (브라우저 내부 저장)</li>
              </ul>
              <p className="mt-4">서비스는 입력된 데이터를 위 목적 외의 용도로 사용하지 않습니다.</p>

              <h3 className="text-xl font-semibold mt-8 mb-4">3. 데이터 제3자 제공</h3>
              <p>다음 외 제3자에게 사용자의 데이터를 판매하거나 공유하지 않습니다.</p>

              <h4 className="text-lg font-medium mt-6 mb-3">(1) OpenAI API</h4>
              <p>입력된 텍스트는 모델 분석을 위해 OpenAI API로 전송됩니다.</p>
              <p>OpenAI는 자체 <strong>API 데이터 사용 정책</strong>에 따라 데이터를 처리합니다.</p>

              <h4 className="text-lg font-medium mt-6 mb-3">(2) 서비스 운영 목적의 기술적 기록</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP 주소, 시간 정보 등 최소한의 접속 로그가 <strong>일시적으로</strong> 서버에 기록될 수 있습니다.</li>
                <li>이 정보는 시스템 운영/보안 목적이며, 사용자 식별 용도로 사용되지 않습니다.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-8 mb-4">4. 데이터 보관 및 보호</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>입력 텍스트는 서버에 장기 저장하지 않습니다.</strong> 분석을 위해 일시적으로 처리된 후 자동 폐기됩니다.</li>
                <li><strong>LocalStorage</strong> - Vivid Chat의 무대 상태, 캐스트 정보는 사용자 브라우저 내부(LocalStorage)에만 저장됩니다.</li>
                <li><strong>모든 데이터 전송은 HTTPS로 암호화되어 처리됩니다.</strong></li>
              </ul>

              <h3 className="text-xl font-semibold mt-8 mb-4">5. 제3자 서비스와의 관계</h3>
              <p>본 서비스는 rofan.ai의 공식 프로그램이 아니며 독립적으로 운영되는 팬/서드파티 도구입니다.</p>
              <p>rofan.ai와는 어떠한 제휴 관계도 없습니다.</p>

              <h3 className="text-xl font-semibold mt-8 mb-4">6. 사용자의 권리</h3>
              <p>사용자는 언제든지:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>LocalStorage를 삭제하여 Vivid Chat 상태를 초기화할 수 있습니다.</li>
                <li>확장 프로그램을 제거하여 데이터 처리를 중단할 수 있습니다.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-8 mb-4">7. 문의하기</h3>
              <p>문의사항은 아래 주소로 연락해 주세요.</p>
              <p><strong>Email:</strong> moomooojojoyoyo@gmail.com</p>
              <p className="mt-4"><strong>Team:</strong> Team Moomoo(팀 무무)</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mt-8 mb-4">Rofan.world Privacy Policy</h2>
              
              <p>
                <strong>Rofan.world</strong> ("the Service") values your privacy and complies with applicable laws and the Chrome Web Store User Data Policy.
              </p>
              <p>This Privacy Policy explains how the Service—including the Chrome extension "Vivid Chat"—collects, uses, and protects your data.</p>

              <h3 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h3>

              <h4 className="text-lg font-medium mt-6 mb-3">(1) User-Provided Input</h4>
              <p>The Service processes only the text you intentionally provide.</p>
              <p><strong>Examples:</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name Generator: keywords, style preferences, cultural themes</li>
                <li>Family Name Generator: thematic inputs, linguistic constraints</li>
                <li>Character Name Generator: traits, gender, personality hints</li>
              </ul>
              <p className="mt-4">User input is processed <strong>only to generate the requested content</strong>.</p>

              <h4 className="text-lg font-medium mt-6 mb-3">(2) Vivid Chat Chrome Extension</h4>
              <p>The extension reads:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Chat text visible on <code className="bg-[var(--card-bg)] px-1 rounded">rofan.ai</code></li>
                <li>Character names, narrative text, and other elements required for visualization</li>
              </ul>
              <p className="mt-4">Flow:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Data is read <strong>locally</strong> from the user's browser</li>
                <li>Sent to <strong>rofan.world</strong> for analysis</li>
                <li>rofan.world forwards it to <strong>OpenAI API</strong></li>
                <li>Only the structured result (JSON) is returned to the user</li>
              </ol>

              <h3 className="text-xl font-semibold mt-8 mb-4">2. How We Use Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>To generate names and related content according to user input</li>
                <li>To analyze and visualize scenes in the Vivid Chat tool</li>
                <li>To maintain visualization state via Local Storage</li>
                <li>To improve service reliability and debug errors</li>
              </ul>
              <p className="mt-4">Data is never used for unrelated purposes.</p>

              <h3 className="text-xl font-semibold mt-8 mb-4">3. Third-Party Sharing</h3>
              <p>The Service does <strong>not</strong> sell or share data except for:</p>

              <h4 className="text-lg font-medium mt-6 mb-3">(1) OpenAI API</h4>
              <p>User text is sent to OpenAI for model inference.</p>
              <p>OpenAI processes data according to their API Data Usage Policies.</p>

              <h4 className="text-lg font-medium mt-6 mb-3">(2) Technical Logs</h4>
              <p>Minimal transient logs (e.g., IP address, timestamps) may be recorded for operational and security reasons.</p>

              <h3 className="text-xl font-semibold mt-8 mb-4">4. Data Storage and Security</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>User input is <strong>not stored permanently</strong> on rofan.world servers.</li>
                <li>Vivid Chat state is stored <strong>only in the user's browser Local Storage</strong>.</li>
                <li>All communications use encrypted HTTPS connections.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-8 mb-4">5. Third-Party Association</h3>
              <p>This Service is <strong>not affiliated with or endorsed by rofan.ai</strong>.</p>
              <p>It is an independent third-party tool built by fans and developers.</p>

              <h3 className="text-xl font-semibold mt-8 mb-4">6. User Rights</h3>
              <p>Users may:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Delete Local Storage data at any time</li>
                <li>Remove the Chrome extension to stop all processing</li>
              </ul>

              <h3 className="text-xl font-semibold mt-8 mb-4">7. Contact</h3>
              <p>For questions regarding this Privacy Policy:</p>
              <p><strong>Email:</strong> moomooojojoyoyo@gmail.com</p>
              <p className="mt-4"><strong>Team:</strong> Team Moomoo(팀 무무)</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer - 링크 포함 */}
      <footer className="border-t border-[var(--card-border)]/30 bg-[var(--card-bg)] mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 md:gap-6 mb-4">
            <Link 
              href="/privacy" 
              className="text-xs text-[var(--text-muted)] hover:text-foreground transition-colors"
            >
              {lang === "ko" ? "개인정보처리방침" : "Privacy Policy"}
            </Link>
            <span className="text-xs text-[var(--text-muted)] hidden md:inline">·</span>
            <Link 
              href="/disclaimer" 
              className="text-xs text-[var(--text-muted)] hover:text-foreground transition-colors"
            >
              {lang === "ko" ? "면책 조항" : "Disclaimer"}
            </Link>
            <span className="text-xs text-[var(--text-muted)] hidden md:inline">·</span>
            <a 
              href="mailto:moomooojojoyoyo@gmail.com" 
              className="text-xs text-[var(--text-muted)] hover:text-foreground transition-colors"
            >
              {lang === "ko" ? "문의하기" : "Contact"}
            </a>
          </div>
          <p className="text-xs text-[var(--text-muted)] text-center">
            © 2025 Team Moomoo(팀 무무). All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PrivacyContent />
    </Suspense>
  );
}
