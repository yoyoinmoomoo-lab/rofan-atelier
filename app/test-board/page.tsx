"use client";

import { useState, useEffect, use } from "react";
import type { StoryState, LangCode, AnalyzeChatRequest } from "@/app/types";
import type { VisualboardIncomingMessage } from "@/app/types/visualboardMessages";
import { isValidVisualboardMessage } from "@/app/types/visualboardMessages";
import { getUIText } from "@/app/i18n/uiText";
import VisualBoard from "@/app/components/visualboard/VisualBoard";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { VISUALBOARD_VERSION } from "@/app/config/version";

type TestBoardSearchParams = {
  embed?: string;
};

export default function TestBoardPage({
  searchParams,
}: {
  searchParams: Promise<TestBoardSearchParams>;
}) {
  const lang: LangCode = "ko";
  const [chatText, setChatText] = useState("");
  const [state, setState] = useState<StoryState | null>(null);
  const [scenarioKey, setScenarioKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolved = use(searchParams);
  const isEmbed = resolved.embed === "1";

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // 디버그용: 어떤 origin에서 무엇이 오는지 전부 찍기
      console.log("[test-board] message received:", event.origin, event.data);

      const data = event.data;

      // 프로토콜 버전 및 sender 필터링
      if (!isValidVisualboardMessage(data)) {
        // 프로토콜 버전이 다른 경우 경고만 출력
        if (data && typeof data === "object" && "protocol" in data) {
          console.warn(
            "[test-board] Received message with different protocol version:",
            (data as { protocol?: unknown }).protocol
          );
        }
        return;
      }

      // 타입 안전하게 처리
      const message = data as VisualboardIncomingMessage;

      if (message.type === "STORY_STATE_UPDATE") {
        console.log(
          "[test-board] STORY_STATE_UPDATE received:",
          message.state,
          "scenarioKey:",
          message.scenarioKey
        );
        setState(message.state ?? null);
        setScenarioKey(message.scenarioKey ?? null);
      }

      if (message.type === "RESET_STORY_STATE") {
        console.log("[test-board] RESET_STORY_STATE received");
        setScenarioKey(null);
        setState(null);
      }
    }

    // 브라우저 환경에서만 리스너 등록
    if (typeof window !== "undefined") {
      window.addEventListener("message", handleMessage);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("message", handleMessage);
      }
    };
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) {
      setError("텍스트를 입력해주세요.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const requestBody: AnalyzeChatRequest = {
        chatText: chatText.trim(),
        previousState: state || undefined,
      };

      const response = await fetch("/api/analyze-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setState(null);
      } else if (data.state) {
        setState(data.state);
        setError(null);
      } else {
        setError(getUIText("testBoardError", lang));
        setState(null);
      }
    } catch (err) {
      console.error("API 호출 오류:", err);
      setError(getUIText("testBoardError", lang));
      setState(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {!isEmbed && (
        <header className="border-b border-[var(--card-border)]/30 bg-[var(--card-bg)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
              {getUIText("testBoardTitle", lang)}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {getUIText("testBoardDescription", lang)}
            </p>
          </div>
        </header>
      )}
      <main
        className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${isEmbed ? "mt-2" : "py-8"}`}
      >
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!isEmbed && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label
                    htmlFor="chatText"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {getUIText("testBoardInputLabel", lang)}
                  </label>
                  <textarea
                    id="chatText"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder={getUIText("testBoardInputPlaceholder", lang)}
                    className="w-full h-48 px-4 py-3 border border-[var(--card-border)] rounded-lg 
                           bg-white text-foreground placeholder-text-muted
                           focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent
                           resize-y"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !chatText.trim()}
                  className="w-full sm:w-auto px-8 py-3 bg-[var(--accent)] text-white rounded-lg 
                         font-medium hover:bg-[var(--accent)]/90 transition-colors 
                         disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? getUIText("generatingText", lang)
                    : getUIText("testBoardAnalyzeButton", lang)}
                </button>
              </form>
            </div>
          )}

          {loading && <LoadingSpinner />}
          {!loading && state && (
            <div className="animate-fade-in">
              <VisualBoard
                state={state}
                lang={lang}
                scenarioKey={scenarioKey ?? undefined}
                onStateRestore={(restoredState) => {
                  setState(restoredState);
                }}
                disableRestore={isEmbed} // embed 모드(Chrome Extension)에서는 복구 비활성화
              />
            </div>
          )}
          {!loading && !state && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-8 text-center text-text-muted">
              <p>
                {isEmbed
                  ? getUIText("visualboardEmptyMessageEmbed", lang)
                  : getUIText("visualboardNoState", lang)}
              </p>
            </div>
          )}
        </div>
      </main>
      {!isEmbed && (
        <footer className="border-t border-[var(--card-border)]/30 bg-[var(--card-bg)] mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-xs text-[var(--text-muted)] text-center">
              {getUIText("footerPoweredBy", lang)}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] text-right mt-2">
              Rofan Visualboard v{VISUALBOARD_VERSION}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
