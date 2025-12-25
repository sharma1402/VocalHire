import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, message: "Invalid or empty JSON body" },
      { status: 400 }
    );
  }

  const { type, role, level, techstack, amount, userid } = body;

  try {
    const { text: questions } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: `Prepare questions for a job interview.
The job role is ${role}.
The job experience level is ${level}.
The tech stack used in the job is: ${techstack}.
The focus between behavioural and technical questions should lean towards: ${type}.
The amount of questions required is: ${amount}.
Return ONLY a JSON array like:
["Question 1","Question 2","Question 3"]
No extra text.`,
    });

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions);
    } catch {
      console.error("Gemini output:", questions);
      return Response.json(
        { success: false, message: "Invalid JSON from AI" },
        { status: 500 }
      );
    }

    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(","),
      questions: parsedQuestions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json({ success: false }, { status: 500 });
  }
}
