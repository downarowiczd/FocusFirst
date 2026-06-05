import type { ContextId, ISODateTime, WorkItemId } from "./ids";

export type WorkItemState = "active" | "blocked" | "parked" | "done";

/**
 * The single thing being worked on inside a Context.
 * Kept intentionally flat: no priority, due date, tags, or assignees.
 * Decision fatigue is the enemy.
 */
export interface WorkItem {
  id: WorkItemId;
  contextId: ContextId;
  title: string;
  state: WorkItemState;
  resumeAnchor: string | null;
  lastTouchedAt: ISODateTime;
}

export type NewWorkItem = Pick<WorkItem, "contextId" | "title">;
