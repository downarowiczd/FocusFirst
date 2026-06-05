import { NextResponse } from "next/server";
import { asInterruptId, interruptRepo } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatchBody {
  processed?: boolean;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.processed !== true) {
    return NextResponse.json(
      { error: "Only { processed: true } is supported" },
      { status: 422 },
    );
  }

  try {
    const interrupt = await interruptRepo.markProcessed(asInterruptId(id));
    return NextResponse.json({ interrupt });
  } catch {
    return NextResponse.json(
      { error: "Interrupt not found or already processed" },
      { status: 404 },
    );
  }
}
