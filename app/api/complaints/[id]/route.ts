import { db } from "@/lib/db";
import { getSessionData } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: complaint } = await db
    .from("complaints")
    .select("*")
    .eq("id", parseInt(params.id))
    .eq("organization_id", session.organizationId)
    .single();

  if (!complaint) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ complaint });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.status) updates.status = body.status;
  if (body.department_id !== undefined) updates.department_id = body.department_id || null;
  if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to || null;

  const { data, error } = await db
    .from("complaints")
    .update(updates)
    .eq("id", parseInt(params.id))
    .eq("organization_id", session.organizationId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ complaint: data });
}
