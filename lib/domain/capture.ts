import type { CaptureId, ContextId, ISODateTime } from "./ids";

/**
 * Quick, unstructured thought saved as raw text.
 * Speed of capture > structure. No tags, no edits, no formatting.
 * contextId is optional so the user can capture without choosing a context first.
 */
export interface Capture {
  id: CaptureId;
  contextId: ContextId | null;
  text: string;
  createdAt: ISODateTime;
}

export type NewCapture = Pick<Capture, "text" | "contextId">;
