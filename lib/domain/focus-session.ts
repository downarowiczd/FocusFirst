import type {
  ContextId,
  FocusSessionId,
  ISODateTime,
  WorkItemId,
} from "./ids";

/**
 * One entry/exit cycle through Focus Mode.
 * `exitAnchor` is the 1-line Resume Anchor written when leaving.
 * Exiting without an exitAnchor is forbidden by the service layer.
 */
export interface FocusSession {
  id: FocusSessionId;
  contextId: ContextId;
  workItemId: WorkItemId | null;
  startedAt: ISODateTime;
  endedAt: ISODateTime | null;
  exitAnchor: string | null;
}

export type StartFocusSession = Pick<FocusSession, "contextId" | "workItemId">;
export type EndFocusSession = { id: FocusSessionId; exitAnchor: string };
