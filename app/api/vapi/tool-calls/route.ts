import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(req: Request) {
  const payload = await req.json();
  const toolCalls = payload?.message?.toolCallList ?? [];

  const results: Array<{ toolCallId: string; result: any }> = [];

  for (const toolCall of toolCalls) {
    const toolCallId = toolCall.id;

    try {
      const fnName = toolCall?.function?.name;
      const argsRaw = toolCall?.function?.arguments;
      const args =
        typeof argsRaw === "string" ? JSON.parse(argsRaw) : (argsRaw ?? {});

      // ---------- generate_interview ----------
      if (fnName === "generate_interview") {

        const { type, role, level, techstack, amount, userId, userid } = args;
        const resolvedUserId = userId ?? userid ?? "voice-user";
        console.log("Received generate_interview call with args:", args);

        if (!role || !level || !techstack || Number(amount) <= 0) {
          results.push({
            toolCallId,
            result: { success: false, error: "Missing required fields" },
          });
          continue;
        }

        const { text } = await generateText({
          model: google("gemini-2.5-flash"),
          prompt: `
            You are an interview preparation system.
            Job Role: ${role}
            Experience Level: ${level}
            Tech Stack: ${techstack}
            Question Focus: ${type}
            Generate ${Number(amount)} interview questions

            Rules:
            - Only return valid JSON
            - No explanation
            - No extra text
            - No special characters

            Return format:
            {
              "questions": ["question 1", "question 2", "question 3"]
            }
          `.trim(),
        });

        console.log("Generated questions:", text);
        const cleaned = String(text).replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        const interview = {
          role,
          type,
          level,
          techstack:
            typeof techstack === "string"
              ? techstack.split(",").map((s: string) => s.trim()).filter(Boolean)
              : techstack,
          questions: parsed.questions,
          userId: resolvedUserId,
          finalized: true,
          coverImage: getRandomInterviewCover(),
          createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection("interviews").add(interview);

        results.push({
          toolCallId,
          result: { success: true, interviewId: docRef.id, interview },
        });
        continue;
      }

      // ---------- load_interview ----------
      if (fnName === "load_interview") {
        const id = args.interviewId;

        if (!id) {
          results.push({
            toolCallId,
            result: { success: false, error: "Missing interview id" },
          });
          continue;
        }

        const snap = await db.collection("interviews").doc(id).get();
        if (!snap.exists) {
          results.push({
            toolCallId,
            result: { success: false, error: "Interview not found" },
          });
          continue;
        }

        results.push({
          toolCallId,
          result: { success: true, interview: { id: snap.id, ...snap.data() } },
        });
        continue;
      }

      results.push({
        toolCallId,
        result: { success: false, error: `Unknown function: ${fnName}` },
      });
    } catch (e: any) {
      console.error("tool-calls fatal error:", e);
      results.push({
        toolCallId,
        result: { success: false, error: e?.message || String(e) },
      });
    }
  }

  return Response.json({ results });
}