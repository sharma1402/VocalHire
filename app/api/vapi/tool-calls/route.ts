import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Vapi sends: payload.message.toolCallList
    const toolCalls = payload?.message?.toolCallList ?? [];

    console.log("tool-calls received count:", toolCalls.length);

    const results: Array<{ toolCallId: string; result: any }> = [];

    for (const toolCall of toolCalls) {
      // Robustly resolve the tool call id + function wrapper
      const toolCallId =
        toolCall.toolCallId ??
        toolCall.id ??
        toolCall?.functionCallId ??
        toolCall?.functionCall?.id;

      const fn =
        toolCall.function ??
        toolCall?.functionCall?.function ??
        toolCall?.functionCall ??
        toolCall;

      const fnName = fn?.name;
      const argsRaw = fn?.arguments;
      const args =
        typeof argsRaw === "string" ? JSON.parse(argsRaw) : (argsRaw ?? {});

      console.log("toolCall:", { toolCallId, fnName, args });

      if (!toolCallId) {
        // still return something valid
        results.push({
          toolCallId: "missing-toolCallId",
          result: { success: false, error: "Missing toolCallId in payload" },
        });
        continue;
      }

      try {
        // ---------- generate_interview ----------
        if (fnName === "generate_interview") {
          const { type, role, level, techstack, amount, userId, userid } = args;
          const resolvedUserId = userId ?? userid ?? "voice-user";

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

              Return format:
              { "questions": ["question 1", "question 2", "question 3"] }
            `.trim(),
          });

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
              result: { success: false, error: "Missing interviewId" },
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
            result: {
              success: true,
              interview: { id: snap.id, ...snap.data() },
            },
          });
          continue;
        }

        results.push({
          toolCallId,
          result: { success: false, error: `Unknown function: ${fnName}` },
        });
      } catch (e: any) {
        console.error("tool call handler error:", e);
        results.push({
          toolCallId,
          result: { success: false, error: e?.message || String(e) },
        });
      }
    }

    // IMPORTANT: always return results array
    return Response.json({ results });
  } catch (e: any) {
    console.error("tool-calls TOP-LEVEL error:", e);
    // Always return JSON so Vapi never sees "No result returned"
    return Response.json({ results: [] });
  }
}