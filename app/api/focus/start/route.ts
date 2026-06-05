import { NextResponse } from "next/server";
import {
  asContextId,
  asWorkItemId,
  contextRepo,
  focusSessionRepo,
  workItemRepo,
} from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StartBody {
  contextId?: string;
  workItemId?: string | null;
}

export async function POST(req: Request) {
  let body: StartBody;
  try {
    body = (await req.json()) as StartBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.contextId || typeof body.contextId !== "string") {
    return NextResponse.json(
      { error: "contextId is required" },
      { status: 400 },
    );
  }

  const contextId = asContextId(body.contextId);
  const ctx = await contextRepo.get(contextId);
  if (!ctx) {
    return NextResponse.json({ error: "Context not found" }, { status: 404 });
  }

  let workItemId = null;
  if (body.workItemId) {
    workItemId = asWorkItemId(body.workItemId);
    const wi = await workItemRepo.get(workItemId);
    if (!wi || wi.contextId !== contextId) {
      return NextResponse.json(
        { error: "WorkItem not found in this context" },
        { status: 404 },
      );
    }
  }

  const session = await focusSessionRepo.start({ contextId, workItemId });
  return NextResponse.json({ session }, { status: 201 });
}
