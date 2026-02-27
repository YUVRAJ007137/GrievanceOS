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

  const { data: responses } = await db
    .from("complaint_responses")
    .select("id, author_type, author_id, message, file_url, created_at")
    .eq("complaint_id", parseInt(params.id))
    .order("created_at");

  return NextResponse.json({ responses: responses ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const message = body.message?.trim();
  const fileUrl = body.file_url || null;

  if (!message && !fileUrl) {
    return NextResponse.json({ error: "Message or file is required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("complaint_responses")
    .insert({
      complaint_id: parseInt(params.id),
      author_type: session.role,
      author_id: session.id,
      message: message || "",
      file_url: fileUrl,
    })
    .select("id, author_type, author_id, message, file_url, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ response: data });
}
