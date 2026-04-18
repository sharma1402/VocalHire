"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { createFeedback } from "@/lib/actions/general.action";

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

const Agent = ({ userName, userId, type, interviewId, questions }: AgentProps) => {
  const router = useRouter();

  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [generatedInterviewId, setGeneratedInterviewId] = useState<string | null>(null);

  // Always-latest transcript buffer (prevents missing final lines on call-end)
  const messagesRef = useRef<SavedMessage[]>([]);
  const hasHandledEndRef = useRef(false); // prevent double-run if call-end fires twice

  const BUILDER_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_BUILDER_ASSISTANT_ID!;
  const INTERVIEWER_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_INTERVIEWER_ASSISTANT_ID!;

  const handleGenerateFeedback = async () => {
    const res = await createFeedback({
      interviewId: interviewId!,
      userId: userId!,
      transcript: messagesRef.current,
    });

    if (res.success) {
      router.push(`/interview/${interviewId}/feedback`);
    } else {
      console.log("Error saving feedback:", (res as any).error);
      router.push("/");
    }
  };

  useEffect(() => {
    const onCallStart = () => {
      hasHandledEndRef.current = false;
      // reset transcript for new call
      messagesRef.current = [];
      setMessages([]);
      setLastMessage("");
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = async () => {
      setCallStatus(CallStatus.FINISHED);

      if (hasHandledEndRef.current) return;
      hasHandledEndRef.current = true;

      if (type === "generate") {
        router.push('/');
        return;
      }

      // allow final transcript messages to flush in
      await new Promise((r) => setTimeout(r, 1200));

      await handleGenerateFeedback();
    };

    const onMessage = (message: any) => {
      console.log("VAPI MESSAGE:", message);

      // Collect final transcript lines
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage: SavedMessage = { role: message.role, content: message.transcript };
        messagesRef.current = [...messagesRef.current, newMessage];
        setMessages(messagesRef.current);
        return;
      }

      // Tool results: capture interviewId returned by generate_interview tool
      if (message.type === "tool-calls-result" || message.type === "tool-calls") {
        const newInterviewId =
          message?.result?.interviewId ||
          message?.results?.[0]?.result?.interviewId ||
          message?.toolCallList?.[0]?.result?.interviewId;

        if (newInterviewId) setGeneratedInterviewId(newInterviewId);
        console.log("generated interview id:", newInterviewId);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (e: any) => {
      console.log("Vapi error (full):", e);
      console.log("Vapi error.error:", e?.error);
      console.log("Vapi error.error.error:", e?.error?.error);
      console.log("Vapi error.error.message:", e?.error?.message);
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
  }, [type, interviewId, userId, generatedInterviewId, router]); // keep values fresh

  // Only update last message display
  useEffect(() => {
    if (messages.length > 0) setLastMessage(messages[messages.length - 1].content);
  }, [messages]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    // GENERATE flow (Builder)
    if (type === "generate") {
      console.log("Starting builder with userId:", userId);
      await vapi.start(BUILDER_ASSISTANT_ID, {
        variableValues: { userId, username: userName },
      });
      return;
    }

    // INTERVIEW flow (Interviewer)
    if (!interviewId) {
      console.log("Missing interviewId for interview call");
      router.push("/");
      return;
    }

    await vapi.start(INTERVIEWER_ASSISTANT_ID, {
      variableValues: {
        interviewId,
        username: userName,
        questions: JSON.stringify(questions ?? []),
      },
    });
  };

  const handleDisconnect = () => {
    vapi.stop();
  };

  return (
    <>
      <div className="flex flex-col items-center gap-10">
      <div className="call-view">
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
              {callStatus === "INACTIVE" || callStatus === "FINISHED" ? "Call" : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
      </div>
    </>
  );
};

export default Agent;