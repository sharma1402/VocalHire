"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
// import { createFeedback } from "@/lib/actions/feedback";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  type,
  interviewId,
}: AgentProps) => {
  const router = useRouter();

  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [generatedInterviewId, setGeneratedInterviewId] = useState<string | null>(null);

  // Assistant IDs from env (must be NEXT_PUBLIC_ because this is a client component)
  const BUILDER_ASSISTANT_ID =
    process.env.NEXT_PUBLIC_VAPI_BUILDER_ASSISTANT_ID!;
  const INTERVIEWER_ASSISTANT_ID =
    process.env.NEXT_PUBLIC_VAPI_INTERVIEWER_ASSISTANT_ID!;

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

    const onMessage = (message: any) => {
    // TEMP: see all events from Vapi
    console.log("VAPI MESSAGE:", message);

    // transcripts
    if (message.type === "transcript" && message.transcriptType === "final") {
      const newMessage = { role: message.role, content: message.transcript };
      setMessages((prev) => [...prev, newMessage]);
      return;
    }

    // tool results: capture interviewId returned by generate_interview tool
    if (
        message.type === "tool-calls-result" ||
        message.type === "tool-calls" // some SDK versions send tool results under this
      ) {
        const interviewId =
          message?.result?.interviewId ||
          message?.results?.[0]?.result?.interviewId ||
          message?.toolCallList?.[0]?.result?.interviewId;

        if (interviewId) setGeneratedInterviewId(interviewId);
        console.log("generated interview id:", interviewId);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (error: Error) => {
      console.log("Vapi Error:", error);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    // const handleGenerateFeedback = async (msgs: SavedMessage[]) => {
    //   const { success, feedbackId: id } = await createFeedback({
    //     interviewId: interviewId!,
    //     userId: userId!,
    //     transcript: msgs,
    //     feedbackId,
    //   });

    //   if (success && id) {
    //     router.push(`/interview/${interviewId}/feedback`);
    //   } else {
    //     console.log("Error saving feedback");
    //     router.push("/");
    //   }
    // };
    if (callStatus !== CallStatus.FINISHED) return;
    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        // Interview Builder finished
        setTimeout(() => router.push("/"), 300);
        } else {
          // Interview finished
          // handleGenerateFeedback(messages);
        }
      }
    }, [callStatus, router, type]);

  const handleCall = async () => {
  setCallStatus(CallStatus.CONNECTING);

  // GENERATE flow (Builder)
  if (type === "generate") {
    console.log("Starting builder with userId:", userId);
    await vapi.start(BUILDER_ASSISTANT_ID, {
      variableValues: {
        userId: userId,
        username: userName,
      },
    });
    return;
  }

  // INTERVIEW flow (Interviewer)
  if (!interviewId) {
    console.log("Missing interviewId fdor interview call");
    router.push("/");
    return;
  }

  await vapi.start(
    INTERVIEWER_ASSISTANT_ID,
    {
      assistantOverrides: {
        variableValues: { 
          interviewId, 
          username: userName 
        },
      },
    } as any
  );
  return;
  }

  const handleDisconnect = () => {
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={handleCall}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />
            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;