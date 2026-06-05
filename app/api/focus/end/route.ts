import { NextResponse } from "next/server";
import {
  asFocusSessionId,
  focusSessionRepo,
  workItemRepo,
} from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EndBody {
  sessionId?: string;
  exitAnchor?: string;
}

export async function POST(req: Request) {
  let body: EndBody;
  try {
    body = (await req.json()) as EndBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.sessionId || typeof body.sessionId !== "string") {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 },
    );
  }
  const anchor = (body.exitAnchor ?? "").trim();
  if (!anchor) {
    return NextResponse.json(
      { error: "exitAnchor is required to end a focus session" },
      { status: 422 },
    );
  }

  const sessionId = asFocusSessionId(body.sessionId);

  let session;
  try {
    session = await focusSessionRepo.end(sessionId, anchor);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to end session";
    return NextResponse.json({ error: message }, { status: 404 });
  }

  // Mirror the exit anchor onto the work item so re-entry surfaces it immediately.
  if (session.workItemId) {
    await workItemRepo.update(session.workItemId, { resumeAnchor: anchor });
  }

  return NextResponse.json({ session });
}
