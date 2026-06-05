import { NextResponse } from "next/server";
import type { WorkItemState } from "@/lib/domain";
import { asWorkItemId, workItemRepo } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATES: readonly WorkItemState[] = [
  "active",
  "blocked",
  "parked",
  "done",
];

interface PatchBody {
  title?: string;
  state?: WorkItemState;
  resumeAnchor?: string | null;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await ctx.params;
  if (!rawId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: PatchBody = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: "title must be a non-empty string" },
        { status: 422 },
      );
    }
    patch.title = body.title.trim();
  }

  if (body.state !== undefined) {
    if (!VALID_STATES.includes(body.state)) {
      return NextResponse.json(
        { error: `state must be one of ${VALID_STATES.join(", ")}` },
        { status: 422 },
      );
    }
    patch.state = body.state;
  }

  if (body.resumeAnchor !== undefined) {
    if (body.resumeAnchor === null) {
      patch.resumeAnchor = null;
    } else if (typeof body.resumeAnchor === "string") {
      const trimmed = body.resumeAnchor.trim();
      patch.resumeAnchor = trimmed.length === 0 ? null : trimmed;
    } else {
      return NextResponse.json(
        { error: "resumeAnchor must be a string or null" },
        { status: 422 },
      );
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "no updatable fields provided" },
      { status: 400 },
    );
  }

  const id = asWorkItemId(rawId);
  if (!(await workItemRepo.get(id))) {
    return NextResponse.json(
      { error: "WorkItem not found" },
      { status: 404 },
    );
  }

  const workItem = await workItemRepo.update(id, patch);
  return NextResponse.json({ workItem });
}
