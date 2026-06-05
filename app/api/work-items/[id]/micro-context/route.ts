import { NextResponse } from "next/server";
import { asWorkItemId } from "@/lib/repositories";
import { getMicroContext } from "@/lib/services/micro-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  return NextResponse.json(await getMicroContext(asWorkItemId(id)));
}
