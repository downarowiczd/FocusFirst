import { NextResponse } from "next/server";
import { interruptRepo } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InterruptBody {
  text?: string;
}

export async function POST(req: Request) {
  let body: InterruptBody;
  try {
    body = (await req.json()) as InterruptBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const interrupt = await interruptRepo.add({ text });
  return NextResponse.json({ interrupt }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({
    interrupts: await interruptRepo.listUnprocessed(),
  });
}
