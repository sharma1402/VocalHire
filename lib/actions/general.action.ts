"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  let query = db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .limit(limit);

  //ONLY filter when user exists
  if (userId) {
    query = query.where("userId", "!=", userId);
  }

  const interviews = await query.get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsById(id: string): Promise<Interview | null> {
    const interview = await db
        .collection('interviews')
        .doc(id)
        .get();

    return interview.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: feedbackSchema,
      prompt: `
        Return an object that matches this exact JSON shape:

        {
          "totalScore": 0-100,
          "categoryScores": [
            { "name": "Communication Skills", "score": 0-100, "comment": "..." },
            { "name": "Technical Knowledge", "score": 0-100, "comment": "..." },
            { "name": "Problem Solving", "score": 0-100, "comment": "..." },
            { "name": "Cultural Fit", "score": 0-100, "comment": "..." },
            { "name": "Confidence and Clarity", "score": 0-100, "comment": "..." }
          ],
          "strengths": ["..."],
          "areasForImprovement": ["..."],
          "finalAssessment": "..."
        }

        Rules:
        - Use exactly those 5 category names, exactly once each, in that order.
        - Use the key "comment" exactly.
        - Use numbers (not strings) for scores.
        - strengths and areasForImprovement must each have at least 1 item.

        Transcript:
        ${formattedTranscript}
        `,
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error: any) {
    console.error("Error saving feedback:", error);
    return { success: false, error: String(error?.message ?? error) };
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const feedback = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (feedback.empty) return null;

  const feedbackDoc = feedback.docs[0];
  return { 
    id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}