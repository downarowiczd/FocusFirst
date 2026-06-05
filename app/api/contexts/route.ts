import { NextResponse } from "next/server";
import { contextRepo } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateContextBody {
  name?: string;
}

export async function POST(req: Request) {
  let body: CreateContextBody;
  try {
    body = (await req.json()) as CreateContextBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const context = await contextRepo.create({ name });
  return NextResponse.json({ context }, { status: 201 });
}

export async function GET() {
  const contexts = await contextRepo.list();
  return NextResponse.json({ contexts });
}
