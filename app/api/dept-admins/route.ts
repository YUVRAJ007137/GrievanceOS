import { db } from "@/lib/db";
import { getSessionData } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: deptAdmins } = await db
    .from("department_admins")
    .select("id, email, full_name, department_id, created_at")
    .eq("organization_id", session.organizationId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ deptAdmins: deptAdmins ?? [] });
}
