export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runDiscovery } from "@/lib/discovery/run";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ found: 0 }, { status: 401 });
  const result = await runDiscovery();
  return NextResponse.json(result);
}
