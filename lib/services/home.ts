import type { Context, WorkItem } from "@/lib/domain";
import { contextRepo, interruptRepo, workItemRepo } from "@/lib/repositories";

export interface ContextSummary {
  context: Context;
  activeCount: number;
}

export interface ResumeSuggestion {
  context: Context;
  workItem: WorkItem;
}

export interface HomePayload {
  contexts: ContextSummary[];
  resume: ResumeSuggestion | null;
  totalActive: number;
  interruptCount: number;
}

export async function getHomePayload(): Promise<HomePayload> {
  const contexts = await contextRepo.list();
  const summaries: ContextSummary[] = [];
  let mostRecent: WorkItem | null = null;
  let mostRecentCtx: Context | null = null;
  let totalActive = 0;

  for (const ctx of contexts) {
    const items = await workItemRepo.listByContext(ctx.id);
    const active = items.filter((w) => w.state === "active");
    totalActive += active.length;
    summaries.push({ context: ctx, activeCount: active.length });

    for (const w of items) {
      if (w.state !== "active") continue;
      if (!mostRecent || w.lastTouchedAt > mostRecent.lastTouchedAt) {
        mostRecent = w;
        mostRecentCtx = ctx;
      }
    }
  }

  const interrupts = await interruptRepo.listUnprocessed();

  return {
    contexts: summaries.slice(0, 5),
    resume:
      mostRecent && mostRecentCtx
        ? { context: mostRecentCtx, workItem: mostRecent }
        : null,
    totalActive,
    interruptCount: interrupts.length,
  };
}
