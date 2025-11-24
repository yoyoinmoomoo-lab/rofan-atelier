"use client";

import { useState } from "react";
import Tabs from "./components/Tabs";
import NameGenerator from "./components/NameGenerator";
import FamilyGenerator from "./components/FamilyGenerator";
import Toast from "./components/Toast";
import FeedbackBox from "./components/FeedbackBox";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"names" | "families">("names");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleCopy = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      {/* 헤더 */}
      <header className="border-b border-[var(--card-border)]/30 bg-[var(--card-bg)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
                  로판 네임 아틀리에
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  Beta
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                당신의 세계를 위한 이름과 가문을 만듭니다
              </p>
            </div>
            <div className="text-[var(--accent)] text-2xl">✧</div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "names" ? (
          <NameGenerator onCopy={handleCopy} />
        ) : (
          <FamilyGenerator onCopy={handleCopy} />
        )}

        {/* 피드백 박스 */}
        <section className="mt-12 border-t border-[var(--card-border)]/30 pt-6">
          <FeedbackBox source="rofan-atelier" />
        </section>
      </main>

      {/* Footer - 모델 정보 */}
      <footer className="border-t border-[var(--card-border)]/30 bg-[var(--card-bg)] mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-[var(--text-muted)] text-center">
            Powered by OpenAI gpt-4o-mini · Beta
          </p>
          <p className="text-xs text-[var(--text-muted)] text-center mt-2">
            한국 로판 작가를 위한 서양식 이름 생성 전용 · 결과는 테스트 중이며 부정확할 수 있습니다
          </p>
        </div>
      </footer>

      {/* 토스트 */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
