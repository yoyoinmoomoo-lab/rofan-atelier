"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import LanguageSelector from "../components/LanguageSelector";
import { getInitialLang } from "../utils/langUtils";
import type { LangCode } from "../types";
import LoadingFallback from "../components/LoadingFallback";

function DisclaimerContent() {
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
          {lang === "ko" ? "면책 조항" : "Disclaimer"}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          <em>{lang === "ko" ? "최종 업데이트일: 2025년 12월 10일" : "Last Updated: December 10, 2025"}</em>
        </p>

        {/* Disclaimer 내용 - 심플한 문서 스타일 */}
        <div className="prose prose-sm max-w-none text-foreground">
          {lang === "ko" ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mt-8 mb-4">면책 조항 (Disclaimer)</h2>

              <h3 className="text-xl font-semibold mt-8 mb-4">1. 비공식 서비스에 대한 안내</h3>
              <p>
                rofan.world 및 이 도메인에서 제공되는 도구들(예: 이름 생성기, 가문명 생성기, 캐릭터 이름 생성기, Vivid Chat 등)은 모두 개인/소규모 팀이 개발한 서드파티(Third-party) 도구입니다.
              </p>
              <p>
                이 서비스들은 어떠한 경우에도 다음과 공식적인 제휴, 승인, 보증 관계에 있지 않습니다.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>rofan.ai</li>
                <li>그 외의 로맨스 판타지/웹소설 관련 플랫폼, 서비스, 출판사, 스튜디오 등</li>
              </ul>
              <p className="mt-4">
                여기서 사용하는 "Rofan"이라는 표현은 일반적인 'Romance Fantasy'의 약칭으로, 특정 회사나 서비스를 지칭하기 위한 브랜드 사용이 아닙니다.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-4">2. AI 채팅 서비스와의 관계</h3>
              <p>
                현재 rofan.world에서 제공하는 Vivid Chat 확장 프로그램 및 웹 서비스는 예시로 rofan.ai와 같은 AI 채팅 서비스의 화면에 표시된 내용을 사용자가 더 잘 '시각화'해서 볼 수 있도록 도와주는 도구입니다.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>해당 AI 채팅 서비스의 기능, 동작, 신뢰성, 결과물에 대해서는 저희가 책임지지 않습니다.</li>
                <li>각 AI 서비스의 이용 약관, 개인정보 처리방침은 각 서비스 제공자의 정책을 따릅니다.</li>
                <li>저희 도구를 사용하더라도, 원래 서비스의 계정, 데이터, 결제 내역 등에 영향을 줄 수 있는 권한은 갖고 있지 않습니다.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-8 mb-4">3. 콘텐츠 및 결과물에 대한 책임</h3>
              <p>
                rofan.world에서 제공하는 기능들은 모두 창작 보조 및 시각화를 위한 도구이며, 다음과 같은 점을 동의하는 경우에만 사용하실 수 있습니다.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>AI의 분석 결과, 이름 추천, 캐릭터 정보, 관계도, 무대 연출 등은 정확성을 보장하지 않습니다.</li>
                <li>생성된 내용은 어디까지나 참고용·창작 보조용이며, 스토리·설정·캐릭터에 대한 최종 결정 책임은 오롯이 사용자에게 있습니다.</li>
                <li>이 도구를 사용함으로 인해 발생하는 손해(예: 설정 오류, 독자 반응, 출판/연재와 관련된 문제 등)에 대해 개발자는 법적 책임을 지지 않습니다.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-8 mb-4">4. 데이터 처리에 대한 별도 안내</h3>
              <p>
                이 면책 조항은 서비스의 성격과 책임 범위를 설명하기 위한 것이며, 데이터 수집·이용·제3자 제공에 관한 내용은 <Link href="/privacy" className="text-[var(--accent)] hover:underline">개인정보처리방침(Privacy Policy)</Link> 문서를 따릅니다.
              </p>
              <p>
                Vivid Chat 및 이름 생성기 계열 서비스는 OpenAI API와 같은 외부 AI 서비스에 텍스트를 전송하여 결과를 생성할 수 있습니다.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-4">5. 서비스 변경 및 중단</h3>
              <p>
                rofan.world에서 제공하는 모든 기능은 사전 공지 없이 변경되거나 중단될 수 있습니다.
              </p>
              <p>
                특히, 외부 서비스(API, AI 플랫폼, 대상 웹사이트)의 정책 변경이나 차단, 장애 등이 발생할 경우 일부 기능이 예고 없이 동작하지 않을 수 있으며, 이에 대해 별도의 보상을 제공하지 않습니다.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-4">6. 문의처</h3>
              <p>
                본 면책 조항 및 서비스 운영과 관련하여 문의가 있으신 경우 아래로 연락해 주세요.
              </p>
              <p><strong>이메일:</strong> moomooojojoyoyo@gmail.com</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mt-8 mb-4">Disclaimer</h2>

              <h3 className="text-xl font-semibold mt-8 mb-4">1. Unofficial, Third-Party Tools</h3>
              <p>
                The services provided under the domain rofan.world — including but not limited to name generators, family/house name generators, character name generators, and Vivid Chat — are independent third-party tools developed by an individual or a small team.
              </p>
              <p>
                These tools are not affiliated with, endorsed by, or officially approved by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>rofan.ai</li>
                <li>Any romance fantasy / web novel platforms, services, publishers, or studios</li>
              </ul>
              <p className="mt-4">
                The term "Rofan" used in this site is intended as a generic shorthand for "Romance Fantasy", and is not meant to represent or impersonate any specific company, brand, or service.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-4">2. Relation to AI Chat Services</h3>
              <p>
                The Vivid Chat extension and related web services provided by rofan.world are designed to help users visualize content shown on external AI chat services (e.g., rofan.ai).
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We do not control or take responsibility for how those AI services function or what results they produce.</li>
                <li>All account management, data handling, and billing policies are governed solely by each AI service provider's own terms and policies.</li>
                <li>Our tools do not have the ability to modify your original AI service account, payment records, or stored data.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-8 mb-4">3. Responsibility for Content and Results</h3>
              <p>
                All features provided by rofan.world are intended for creative assistance and visualization only. By using these tools, you acknowledge that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Any analysis results, name suggestions, character information, relationship diagrams, or stage compositions are not guaranteed to be accurate or consistent.</li>
                <li>All generated content is for reference and creative support. Final decisions about your story, setting, and characters remain entirely your own responsibility.</li>
                <li>The Developer is not liable for any loss or damage arising from the use of these tools (including but not limited to story inconsistencies, reader reactions, or issues related to publishing/serialization).</li>
              </ul>

              <h3 className="text-xl font-semibold mt-8 mb-4">4. Data Handling Notice</h3>
              <p>
                This Disclaimer describes the nature of the service and the scope of responsibility. For details on data collection, usage, and sharing, please refer to our <Link href="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</Link>.
              </p>
              <p>
                Some features (such as Vivid Chat and name generators) may send text to external AI providers like OpenAI in order to generate results.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-4">5. Service Changes and Availability</h3>
              <p>
                All features provided via rofan.world may be changed or discontinued at any time without prior notice.
              </p>
              <p>
                In particular, if external services (APIs, AI platforms, target websites) change their policies, become unavailable, or block access, some features may stop working unexpectedly. No compensation will be provided for such interruptions.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-4">6. Contact</h3>
              <p>
                If you have any questions regarding this Disclaimer or the operation of the service, please contact:
              </p>
              <p><strong>Email:</strong> moomooojojoyoyo@gmail.com</p>
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

export default function DisclaimerPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DisclaimerContent />
    </Suspense>
  );
}
