"use client";

import { useState } from "react";
import type { LangCode } from "../types";
import { getUIText } from "../i18n/uiText";

type FeedbackSource = "rofan-world" | "other";

interface FeedbackBoxProps {
  source: FeedbackSource;
  lang: LangCode;
}

export default function FeedbackBox({ source, lang }: FeedbackBoxProps) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (msg.trim().length < 3) return;
    
    setLoading(true);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, source }),
      });
      
      if (r.ok) {
        setDone(true);
        setMsg("");
        setTimeout(() => {
          setDone(false);
          setOpen(false);
        }, 2000);
      } else {
        alert(getUIText("feedbackError", lang));
      }
    } catch {
      alert(getUIText("feedbackError", lang));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        onClick={() => setOpen(!open)}
      >
        {getUIText("feedbackToggle", lang)}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <textarea
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            rows={4}
            placeholder={getUIText("feedbackPlaceholder", lang)}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <div className="space-y-1">
            <p className="text-xs text-[var(--text-muted)]">
              {getUIText("feedbackNoteAnonymous", lang)}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {getUIText("feedbackNoteMinLength", lang)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={submit}
              disabled={loading || msg.trim().length < 3}
            >
              {loading ? getUIText("feedbackSending", lang) : getUIText("feedbackSubmitButton", lang)}
            </button>
            {done && (
              <span className="text-sm text-green-600">
                {getUIText("feedbackSuccess", lang)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

