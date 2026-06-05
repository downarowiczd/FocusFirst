import { NextResponse } from "next/server";
import { contextRepo } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const contexts = await contextRepo.list();
  return NextResponse.json({ contexts });
}
