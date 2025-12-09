/**
 * Visualboard 메시지 프로토콜 타입 정의
 * 
 * sidepanel.js ↔ rofan.world iframe 간 postMessage 통신에 사용되는 타입
 * 프로토콜 버전: visualboard-v1
 */

import type { StoryState } from "@/app/types";

export type VisualboardProtocolVersion = "visualboard-v1";

export interface StoryStateUpdateMessage {
  protocol: VisualboardProtocolVersion;
  sender: "visualboard-sidepanel";
  type: "STORY_STATE_UPDATE";
  scenarioKey?: string;
  state: StoryState;
  timestamp: number;
}

export interface ResetStoryStateMessage {
  protocol: VisualboardProtocolVersion;
  sender: "visualboard-sidepanel";
  type: "RESET_STORY_STATE";
  timestamp: number;
}

export type VisualboardIncomingMessage =
  | StoryStateUpdateMessage
  | ResetStoryStateMessage;

/**
 * 메시지가 유효한 Visualboard 메시지인지 검증
 */
export function isValidVisualboardMessage(
  data: unknown
): data is VisualboardIncomingMessage {
  if (!data || typeof data !== "object") {
    return false;
  }

  const msg = data as Record<string, unknown>;

  // 프로토콜 버전 체크
  if (msg.protocol !== "visualboard-v1") {
    return false;
  }

  // sender 체크
  if (msg.sender !== "visualboard-sidepanel") {
    return false;
  }

  // type 체크
  if (msg.type === "STORY_STATE_UPDATE") {
    return (
      typeof msg.timestamp === "number" &&
      typeof msg.state === "object" &&
      msg.state !== null
    );
  }

  if (msg.type === "RESET_STORY_STATE") {
    return typeof msg.timestamp === "number";
  }

  return false;
}

