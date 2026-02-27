import { db } from "@/lib/db";
import { getSessionData } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const deptId = searchParams.get("department_id");

  let query = db
    .from("complaints")
    .select("id, title, description, status, priority, department_id, user_id, assigned_to, file_url, created_at, updated_at")
    .eq("organization_id", session.organizationId)
    .order("created_at", { ascending: false });

  if (session.role === "dept_admin" && session.departmentId) {
    query = query.eq("department_id", session.departmentId);
  } else if (session.role === "user") {
    query = query.eq("user_id", session.id);
  } else if (deptId) {
    query = query.eq("department_id", parseInt(deptId));
  }

  const { data: complaints } = await query;

  return NextResponse.json({ complaints: complaints ?? [] });
}
