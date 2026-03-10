import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { type, role, level, techstack, amount, userid } = body;

    if (!role || !level || !techstack || !amount) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
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
          "questions": [
            "question 1",
            "question 2",
            "question 3"
          ]
        }
        `,
    });

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const interview = {
      role,
      type,
      level,
      techstack:
        typeof techstack === "string"
          ? techstack.split(",")
          : techstack,

      questions: parsed.questions,

      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true, data: interview });

  } catch (error) {
    console.error("Interview generation error:", error);

    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
      );
  }
}

export async function GET() {
  return Response.json(
    { success: true, message: "Interview API running" },
    { status: 200 }
  );
}