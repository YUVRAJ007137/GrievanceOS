import { NextRequest, NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";

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

      if (res.status === 429) {
        console.log(`[AI] ${model} rate limited, trying next…`);
        continue;
      }

      if (!res.ok) {
        console.log(`[AI] ${model} error ${res.status}, trying next…`);
        continue;
      }

      const data = await res.json();
      console.log(`[AI] ${model} raw:`, JSON.stringify(data).slice(0, 500));
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const outputPart = parts.filter((p: { thought?: boolean }) => !p.thought).pop();
      const text = (outputPart?.text ?? "").trim();
      console.log(`[AI] ${model} text: "${text}" (parts: ${parts.length})`);
      if (!text) continue;
      return text;
    } catch (err) {
      console.log(`[AI] ${model} exception:`, err);
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
    console.log("[AI] No valid GEMINI_API_KEY configured");
    return NextResponse.json({ department_id: null });
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
    console.log("[AI] No match or all models exhausted");
    return NextResponse.json({ department_id: null });
  }

  const numMatch = rawText.match(/(\d+)/);
  if (!numMatch) {
    console.log("[AI] No number found in response:", rawText);
    return NextResponse.json({ department_id: null });
  }

  const parsed = parseInt(numMatch[1], 10);
  const matchedDept = departments.find(
    (d: { id: number }) => Number(d.id) === parsed
  );

  console.log("[AI] Parsed ID:", parsed, "Matched:", matchedDept?.name ?? "NONE");

  return NextResponse.json({
    department_id: matchedDept ? parsed : null,
  });
}
