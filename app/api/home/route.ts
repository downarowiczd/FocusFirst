import { NextResponse } from "next/server";
import { getHomePayload } from "@/lib/services/home";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getHomePayload());
}
