"use client";

import { useState, useEffect } from "react";
import type { StoryState, LangCode } from "@/app/types";
import { getUIText } from "@/app/i18n/uiText";
import VisualBoard from "@/app/components/visualboard/VisualBoard";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function TestBoardPage() {
  const lang: LangCode = "ko"; // 기본값 "ko"
  const [chatText, setChatText] = useState("");
  const [state, setState] = useState<StoryState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receivedMsg, setReceivedMsg] = useState<string>("");
  const [storyData, setStoryData] = useState<{ speaker: string; text: string; mood?: string } | null>(null);

  // Extension으로부터 메시지 수신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 보안: origin 확인 (rofan.world 또는 chrome-extension에서만 수신)
      if (
        event.origin !== 'https://rofan.world' &&
        !event.origin.startsWith('chrome-extension://')
      ) {
        console.warn('[Test Board] Message from unexpected origin:', event.origin);
        return;
      }

      if (event.data.type === 'FROM_EXTENSION') {
        const payload = event.data.payload;
        setReceivedMsg(payload);
        console.log('[Test Board] Received message from extension:', payload);
      } else if (event.data.type === 'STORY_DATA') {
        const payload = event.data.payload;
        setStoryData(payload);
        console.log('[Test Board] Received STORY_DATA from extension:', payload);
      } else if (event.data.type === 'STORY_STATE_UPDATE') {
        const storyState = event.data.state;
        console.log('[Test Board] Received STORY_STATE_UPDATE from extension:', storyState);
        
        if (storyState) {
          // StoryState 타입 검증
          if (
            storyState.scene &&
            storyState.characters &&
            Array.isArray(storyState.characters) &&
            storyState.dialogue_impact
          ) {
            setState(storyState as StoryState);
            setError(null);
            console.log('[Test Board] StoryState updated successfully');
          } else {
            console.error('[Test Board] Invalid StoryState structure:', storyState);
            setError('Invalid StoryState received from extension');
          }
        } else {
          console.error('[Test Board] STORY_STATE_UPDATE missing state:', event.data);
          setError('StoryState data is missing');
        }
      } else if (event.data.type === 'RESET_STORY_STATE') {
        console.log('[Test Board] Received RESET_STORY_STATE from extension');
        setState(null);
        setError(null);
        console.log('[Test Board] StoryState reset successfully');
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
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
    setState(null);

    try {
      const response = await fetch("/api/analyze-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatText: chatText.trim() }),
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
      {/* 헤더 */}
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

      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Extension으로부터 받은 메시지 표시 */}
          {receivedMsg && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Extension으로부터 받은 메시지:
              </p>
              <p className="text-sm text-blue-700 whitespace-pre-wrap">
                {receivedMsg}
              </p>
            </div>
          )}

          {/* STORY_DATA 대화창 스타일 표시 */}
          {storyData && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-base mb-1">
                    {storyData.speaker}
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {storyData.text}
                  </p>
                  {storyData.mood && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                      {storyData.mood}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 입력 영역 */}
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
                {loading ? getUIText("generatingText", lang) : getUIText("testBoardAnalyzeButton", lang)}
              </button>
            </form>

            {/* 에러 메시지 */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* 로딩 스피너 */}
          {loading && <LoadingSpinner />}

          {/* 결과 시각화 */}
          {!loading && state && (
            <div className="animate-fade-in">
              <VisualBoard state={state} lang={lang} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)]/30 bg-[var(--card-bg)] mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-[var(--text-muted)] text-center">
            {getUIText("footerPoweredBy", lang)}
          </p>
        </div>
      </footer>
    </div>
  );
}


