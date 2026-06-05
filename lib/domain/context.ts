import type { ContextId, ISODateTime } from "./ids";

/**
 * A deep work area. Only one Context is active at a time.
 * Minimal by design: a name, and an optional one-line hint of where
 * to resume next time the user opens this context.
 */
export interface Context {
  id: ContextId;
  name: string;
  resumeHint: string | null;
  createdAt: ISODateTime;
}

export type NewContext = Pick<Context, "name">;
