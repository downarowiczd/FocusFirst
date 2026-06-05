import type { InterruptId, ISODateTime } from "./ids";

/**
 * Incoming work that did NOT originate from focus.
 * Lives in the Interrupt Queue and is never shown during Focus Mode.
 * Processed manually — `processedAt` marks it as handled.
 */
export interface Interrupt {
  id: InterruptId;
  text: string;
  createdAt: ISODateTime;
  processedAt: ISODateTime | null;
}

export type NewInterrupt = Pick<Interrupt, "text">;
