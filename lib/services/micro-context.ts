import type {
  Capture,
  ISODateTime,
  WorkItem,
  WorkItemId,
} from "@/lib/domain";
import {
  captureRepo,
  focusSessionRepo,
  workItemRepo,
} from "@/lib/repositories";

export type ActivityKind =
  | "workItemTouched"
  | "captureAdded"
  | "sessionStarted"
  | "sessionEnded";

export interface ActivityEvent {
  at: ISODateTime;
  kind: ActivityKind;
  label: string;
  refId: string;
}

export interface MicroContext {
  /** Up to 2 other work items in the same context, most recently touched first. */
  relatedWorkItems: WorkItem[];
  /** Up to 3 captures in the same context, newest first. */
  recentCaptures: Capture[];
  /** Newest-first merged feed of activity in the same context. */
  timeline: ActivityEvent[];
}

export interface MicroContextOptions {
  relatedLimit?: number;
  captureLimit?: number;
  timelineLimit?: number;
}

/**
 * Returns a small, deterministic slice of recent activity around a work item.
 * No ranking, no ML — just recency on the same context.
 */
export async function getMicroContext(
  workItemId: WorkItemId,
  opts: MicroContextOptions = {},
): Promise<MicroContext> {
  const relatedLimit = opts.relatedLimit ?? 2;
  const captureLimit = opts.captureLimit ?? 3;
  const timelineLimit = opts.timelineLimit ?? 10;

  const focus = await workItemRepo.get(workItemId);
  if (!focus) {
    return { relatedWorkItems: [], recentCaptures: [], timeline: [] };
  }

  const [siblings, captures, sessions] = await Promise.all([
    workItemRepo.listByContext(focus.contextId),
    captureRepo.list(focus.contextId),
    focusSessionRepo.listByContext(focus.contextId, { limit: 20 }),
  ]);

  const relatedWorkItems = siblings
    .filter((w) => w.id !== focus.id)
    .sort((a, b) => (a.lastTouchedAt < b.lastTouchedAt ? 1 : -1))
    .slice(0, relatedLimit);

  const recentCaptures = [...captures]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, captureLimit);

  const timeline: ActivityEvent[] = [];

  for (const w of siblings) {
    timeline.push({
      at: w.lastTouchedAt,
      kind: "workItemTouched",
      label: w.id === focus.id ? `${w.title} (in focus)` : w.title,
      refId: w.id,
    });
  }
  for (const c of captures) {
    timeline.push({
      at: c.createdAt,
      kind: "captureAdded",
      label: c.text.length > 80 ? `${c.text.slice(0, 77)}…` : c.text,
      refId: c.id,
    });
  }
  for (const s of sessions) {
    timeline.push({
      at: s.startedAt,
      kind: "sessionStarted",
      label: "Focus session started",
      refId: s.id,
    });
    if (s.endedAt) {
      timeline.push({
        at: s.endedAt,
        kind: "sessionEnded",
        label: s.exitAnchor
          ? `Exited with anchor: ${s.exitAnchor}`
          : "Focus session ended",
        refId: s.id,
      });
    }
  }

  timeline.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    relatedWorkItems,
    recentCaptures,
    timeline: timeline.slice(0, timelineLimit),
  };
}
