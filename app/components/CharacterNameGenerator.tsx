"use client";

import { useState } from "react";
import type {
  NameInputState,
  CharacterNameResult,
  GenerateCharacterNamesRequest,
  LangCode,
  Gender,
} from "../types";
import { getCharacterUIText, type CharacterUITextKey } from "../i18n/uiText.character";
import LoadingSpinner from "./LoadingSpinner";
import ScaleControl from "./ScaleControl";

interface CharacterNameGeneratorProps {
  lang: LangCode;
  onCopy?: (message: string) => void;
}

export default function CharacterNameGenerator({
  lang,
  onCopy,
}: CharacterNameGeneratorProps) {
  const [inputState, setInputState] = useState<NameInputState>({
    gender: "male",
    tone_strength: 3,
    eraLevel: 3,
    characterPrompt: "",
  });
  const [names, setNames] = useState<CharacterNameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // 캐릭터 설명 변경 (80자 제한)
  const handleCharacterPromptChange = (value: string) => {
    const limited = value.slice(0, 80);
    setInputState((prev) => ({ ...prev, characterPrompt: limited }));
  };

  // 이름 생성 요청
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);

    // GA 이벤트 전송
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "character_name_generate_click", {
        event_category: "generate_button",
        event_label: "generate_5_character_names",
        lang,
        tone_level: inputState.tone_strength,
        era_level: inputState.eraLevel,
        gender: inputState.gender,
        personality_count: 0,
        trait_count: 0,
        has_custom_note: inputState.characterPrompt.trim().length > 0 ? 1 : 0,
      });
    }

    setLoading(true);

    try {
      const requestBody: GenerateCharacterNamesRequest = {
        ...inputState,
        lang,
      };

      const response = await fetch("/api/generate-character-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.errorKey) {
        // 에러 키가 있으면 i18n 메시지로 표시
        setErrorKey(data.errorKey);
        // names는 그대로 유지
      } else if (data.names) {
        // 성공
        setNames(data.names);
        setErrorKey(null);
      }
    } catch (err) {
      // 네트워크 오류 등
      console.error("API 호출 오류:", err);
      setErrorKey("error_server");
    } finally {
      setLoading(false);
    }
  };


  // 이름만 복사
  const copyName = (name: CharacterNameResult) => {
    const displayText =
      lang === "ko" && name.name_kor
        ? `${name.name_kor} / ${name.name_rom}`
        : name.name_rom;
    navigator.clipboard.writeText(displayText);
    if (onCopy) {
      onCopy(getCharacterUIText("copySuccessMessage", lang));
    }
  };

  // 전체 복사
  const copyFull = (name: CharacterNameResult) => {
    const displayName =
      lang === "ko" && name.name_kor
        ? `${name.name_kor} / ${name.name_rom}`
        : name.name_rom;
    
    let text = displayName;
    if (name.desc) {
      text += `\n${name.desc}`;
    }
    
    navigator.clipboard.writeText(text);
    if (onCopy) {
      onCopy(getCharacterUIText("copySuccessMessage", lang));
    }
  };

  return (
    <div className="space-y-8">
      {/* 타이틀 + 설명 */}
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
          {getCharacterUIText("title", lang)}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {getCharacterUIText("intro_guide", lang)}
        </p>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 space-y-6">
        {/* 성별 선택 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {getCharacterUIText("gender_label", lang)}
          </label>
          <div className="flex gap-4">
            {(["male", "female", "neutral"] as Gender[]).map((gender) => (
              <label
                key={gender}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={inputState.gender === gender}
                  onChange={(e) =>
                    setInputState((prev) => ({
                      ...prev,
                      gender: e.target.value as Gender,
                    }))
                  }
                  className="w-4 h-4 text-[var(--accent)] border-[var(--card-border)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-foreground">
                  {gender === "male"
                    ? lang === "ko"
                      ? "남성"
                      : "Male"
                    : gender === "female"
                    ? lang === "ko"
                      ? "여성"
                      : "Female"
                    : lang === "ko"
                    ? "중성"
                    : "Neutral"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 캐릭터 설명 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {getCharacterUIText("character_prompt_label", lang)}
          </label>
          <p className="text-xs text-[var(--text-muted)] mb-2">
            {getCharacterUIText("character_prompt_help", lang)}
          </p>
          <textarea
            value={inputState.characterPrompt}
            onChange={(e) => handleCharacterPromptChange(e.target.value)}
            placeholder={getCharacterUIText("character_prompt_placeholder", lang)}
            maxLength={80}
            rows={3}
            className="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {inputState.characterPrompt.length}/80
          </p>
        </div>

        {/* 어조 강도 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {getCharacterUIText("tone_label", lang)}
          </label>
          <ScaleControl
            value={inputState.tone_strength}
            onChange={(value) =>
              setInputState((prev) => ({
                ...prev,
                tone_strength: value,
              }))
            }
            min={1}
            max={5}
            labels={{
              1: { ko: "포근함", en: "Gentle" },
              2: { ko: "부드러움", en: "Soft" },
              3: { ko: "중간", en: "Balanced" },
              4: { ko: "강렬함", en: "Intense" },
              5: { ko: "매우 강렬", en: "Very Intense" },
            }}
            lang={lang}
            helpText={getCharacterUIText("tone_help", lang)}
          />
        </div>

        {/* 시대감 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {getCharacterUIText("era_label", lang)}
          </label>
          <ScaleControl
            value={inputState.eraLevel}
            onChange={(value) =>
              setInputState((prev) => ({
                ...prev,
                eraLevel: value,
              }))
            }
            min={1}
            max={5}
            labels={{
              1: { ko: "신화·고대", en: "Mythic/Ancient" },
              2: { ko: "중세", en: "Medieval" },
              3: { ko: "중세~근세", en: "Medieval~Early Modern" },
              4: { ko: "근세", en: "Early Modern" },
              5: { ko: "근현대~모던", en: "Modern~Contemporary" },
            }}
            lang={lang}
            helpText={getCharacterUIText("era_help", lang)}
          />
        </div>

        {/* 생성 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? getCharacterUIText("generatingText", lang)
            : getCharacterUIText("generate_button", lang)}
        </button>
      </form>

      {/* 에러 메시지 */}
      {errorKey && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {getCharacterUIText(errorKey as CharacterUITextKey, lang)}
        </div>
      )}

      {/* 로딩 */}
      {loading && <LoadingSpinner />}

      {/* 결과 카드 리스트 */}
      {!loading && names.length > 0 && (
        <div className="space-y-4">
          {names.map((name, index) => {
            // 언어에 따라 이름 표시 방식 결정 (이름 탭과 동일 형식)
            const displayName =
              lang === "ko" && name.name_kor
                ? `${name.name_kor} / ${name.name_rom}`
                : name.name_rom;

            return (
              <div
                key={`${name.name_rom}-${index}`}
                className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="font-serif text-lg font-semibold text-foreground">
                        {displayName}
                      </span>
                    </div>
                    
                    {/* 설명 (desc) */}
                    {name.desc && (
                      <div className="text-sm text-[var(--text-muted)] leading-relaxed">
                        {name.desc}
                      </div>
                    )}
                  </div>
                  
                  {/* 복사 버튼들 */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyName(name)}
                      className="px-4 py-2 text-sm border border-[var(--card-border)] rounded-lg hover:bg-[var(--accent-light)]/20 transition-colors whitespace-nowrap"
                    >
                      {getCharacterUIText("copyNameButton", lang)}
                    </button>
                    <button
                      onClick={() => copyFull(name)}
                      className="px-4 py-2 text-sm border border-[var(--card-border)] rounded-lg hover:bg-[var(--accent-light)]/20 transition-colors whitespace-nowrap"
                    >
                      {getCharacterUIText("copyFullButton", lang)}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 빈 상태 메시지 */}
      {!loading && names.length === 0 && !errorKey && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p className="text-sm">
            {getCharacterUIText("empty_state_message", lang)}
          </p>
        </div>
      )}
    </div>
  );
}

