import { NextResponse } from "next/server";
import {
  asContextId,
  captureRepo,
  contextRepo,
} from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CaptureBody {
  text?: string;
  contextId?: string | null;
}

export async function POST(req: Request) {
  let body: CaptureBody;
  try {
    body = (await req.json()) as CaptureBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  let contextId = null;
  if (body.contextId) {
    contextId = asContextId(body.contextId);
    if (!(await contextRepo.get(contextId))) {
      return NextResponse.json(
        { error: "Context not found" },
        { status: 404 },
      );
    }
  }

  const capture = await captureRepo.add({ text, contextId });
  return NextResponse.json({ capture }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ captures: await captureRepo.list() });
}
