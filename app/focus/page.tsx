import { notFound } from "next/navigation";
import { FocusScreen } from "@/components/FocusScreen";
import {
  asContextId,
  asWorkItemId,
  contextRepo,
  focusSessionRepo,
  workItemRepo,
} from "@/lib/repositories";
import { getMicroContext } from "@/lib/services/micro-context";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ context?: string; item?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { context: ctxParam, item: itemParam } = await searchParams;

  // Resolve context: explicit ?context= wins; otherwise fall back to the
  // context that owns the most recently touched active work item.
  let contextId = ctxParam ? asContextId(ctxParam) : null;
  let workItemId = itemParam ? asWorkItemId(itemParam) : null;

  if (!contextId) {
    const contexts = await contextRepo.list();
    let candidate = null;
    for (const c of contexts) {
      const items = await workItemRepo.listByContext(c.id);
      for (const w of items) {
        if (w.state !== "active") continue;
        if (!candidate || w.lastTouchedAt > candidate.workItem.lastTouchedAt) {
          candidate = { context: c, workItem: w };
        }
      }
    }
    if (!candidate) notFound();
    contextId = candidate.context.id;
    workItemId = candidate.workItem.id;
  }

  const context = await contextRepo.get(contextId);
  if (!context) notFound();

  // Pick a work item if not specified: most recent active in this context.
  let workItem = workItemId ? await workItemRepo.get(workItemId) : null;
  if (!workItem || workItem.contextId !== context.id) {
    const items = await workItemRepo.listByContext(context.id);
    workItem = items.find((w) => w.state === "active") ?? items[0] ?? null;
  }
  if (!workItem) notFound();

  const microContext = await getMicroContext(workItem.id);

  const session = await focusSessionRepo.start({
    contextId: context.id,
    workItemId: workItem.id,
  });

  return (
    <FocusScreen
      context={context}
      workItem={workItem}
      microContext={microContext}
      sessionId={session.id}
    />
  );
}
