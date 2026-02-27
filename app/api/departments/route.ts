import { db } from "@/lib/db";
import { getSessionData } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: departments } = await db
    .from("departments")
    .select("id, name, description, created_at")
    .eq("organization_id", session.organizationId)
    .order("name");

  return NextResponse.json({ departments: departments ?? [] });
}
