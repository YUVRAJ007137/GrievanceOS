import { NextRequest, NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 15;

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-pro-latest",
];

async function callGemini(apiKey: string, prompt: string): Promise<string | null> {
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 256,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );

      if (res.status === 429) continue;
      if (!res.ok) continue;

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const outputPart = parts.filter((p: { thought?: boolean }) => !p.thought).pop();
      const text = (outputPart?.text ?? "").trim();
      if (!text) continue;
      return text;
    } catch {
      continue;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { description, departments } = await req.json();

  if (
    !description ||
    typeof description !== "string" ||
    !Array.isArray(departments) ||
    departments.length === 0
  ) {
    return NextResponse.json({ department_id: null });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return NextResponse.json({ department_id: null, error: "no_api_key" });
  }

  const deptList = departments
    .map((d: { id: number; name: string }) => `${d.id}: ${d.name}`)
    .join("\n");

  const prompt = `You are a complaint routing system. Given a complaint, pick the single best department from the list.

DEPARTMENTS:
${deptList}

COMPLAINT:
"${description}"

Reply with ONLY the department ID number. Nothing else. No punctuation, no explanation. Just the number. If no department fits, reply: none`;

  const rawText = await callGemini(apiKey, prompt);

  if (!rawText || rawText.toLowerCase().includes("none")) {
    return NextResponse.json({ department_id: null });
  }

  const numMatch = rawText.match(/(\d+)/);
  if (!numMatch) {
    return NextResponse.json({ department_id: null });
  }

  const parsed = parseInt(numMatch[1], 10);
  const matchedDept = departments.find(
    (d: { id: number }) => Number(d.id) === parsed
  );

  return NextResponse.json({
    department_id: matchedDept ? parsed : null,
  });
}
