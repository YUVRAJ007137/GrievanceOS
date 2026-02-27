import { db } from "@/lib/db";
import { getSessionData } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "user") {
    return NextResponse.json({ error: "Only users can submit complaints" }, { status: 403 });
  }

  const body = await request.json();
  const title = body.title?.trim();
  const description = body.description?.trim();
  const departmentId = body.department_id ? parseInt(body.department_id) : null;
  const priority = body.priority || "medium";
  const fileUrl = body.file_url || null;

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("complaints")
    .insert({
      organization_id: session.organizationId,
      department_id: departmentId,
      user_id: session.id,
      title,
      description,
      priority,
      file_url: fileUrl,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ complaint: data });
}
