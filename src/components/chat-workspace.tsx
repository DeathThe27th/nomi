"use client";

import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import { ArrowUp, Mic, Square, Volume2 } from "lucide-react";
import type { TransactionPlan } from "@/lib/domain/schemas";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  kind?: "text" | "voice" | "status";
};

type Props = {
  walletAddress: string;
  balanceLabel: string;
  pendingPlan: TransactionPlan | null;
  messages: ChatMessage[];
  onSendText: (text: string) => void | Promise<void>;
  onVoiceNote: (audio: Blob) => void | Promise<void>;
  busy?: boolean;
};

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function PlanCard({ plan }: { plan: TransactionPlan }) {
  const action = plan.actions[0];
  const status =
    plan.status === "AWAITING_CONFIRMATION"
      ? "Awaiting confirmation"
      : plan.status.charAt(0) + plan.status.slice(1).toLowerCase();

  return (
    <section className="plan-card" aria-label="Transaction plan">
      <div className="plan-card__topline">
        <span>{status}</span>
        <span>X Layer Testnet</span>
      </div>
      <div className="plan-card__amount">{action.amount} OKB</div>
      <div className="plan-card__route" aria-label={`Send to ${action.recipient.address}`}>
        <span className="plan-card__token">OKB</span>
        <span className="plan-card__arrow" aria-hidden="true">→</span>
        <span className="plan-card__recipient">
          <strong>{action.recipient.kind === "contact" ? action.recipient.name : "Wallet"}</strong>
          <small>{shortAddress(action.recipient.address)}</small>
        </span>
      </div>
      <div className="plan-card__note">
        Say “Yes” to confirm, ask for a change, or cancel.
      </div>
    </section>
  );
}

export function ChatWorkspace({
  walletAddress,
  balanceLabel,
  pendingPlan,
  messages,
  onSendText,
  onVoiceNote,
  busy = false,
}: Props) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setText("");
    await onSendText(message);
  }

  async function startRecording() {
    setRecordingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferred = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "";
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (blob.size) await onVoiceNote(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecordingError("Microphone access was blocked. Allow it in your browser settings and try again.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <main className="chat-workspace">
      <header className="chat-header">
        <div>
          <span className="chat-header__label">Available on X Layer</span>
          <strong>{balanceLabel}</strong>
        </div>
        <button className="wallet-chip" type="button" aria-label={`Wallet ${walletAddress}`}>
          <span className="wallet-chip__dot" />
          {shortAddress(walletAddress)}
        </button>
      </header>

      <div className="chat-thread" aria-live="polite">
        <div className="message message--assistant message--greeting">
          <div className="message__identity">
            <Image src="/nomi-mark.svg" alt="" width={32} height={32} />
            <span>Nomi</span>
          </div>
          <p>Hi, I’m Nomi, how can I assist you today?</p>
          <div className="suggestions" aria-label="Suggestions">
            <button type="button" onClick={() => onSendText("What is my OKB balance?")}>Check my balance</button>
            <button type="button" onClick={() => onSendText("Who is in my address book?")}>Show my contacts</button>
          </div>
        </div>

        {messages.map((message) => (
          <div key={message.id} className={`message message--${message.role}`}>
            {message.kind === "voice" && (
              <span className="voice-note-label"><Volume2 size={14} /> Voice note</span>
            )}
            <p>{message.content}</p>
          </div>
        ))}

        {pendingPlan && <PlanCard plan={pendingPlan} />}
        {busy && <div className="thinking" role="status"><i /><i /><i /><span>Nomi is thinking</span></div>}
      </div>

      <div className="composer-wrap">
        {recordingError && <p className="composer-error" role="alert">{recordingError}</p>}
        {recording && (
          <div className="recording-state" role="status">
            <span className="recording-state__pulse" />
            Listening… tap stop when you’re done.
          </div>
        )}
        <form className="composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="nomi-message">Message Nomi</label>
          <textarea
            id="nomi-message"
            rows={1}
            maxLength={1000}
            placeholder="Message Nomi"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            className={recording ? "composer__voice composer__voice--recording" : "composer__voice"}
            type="button"
            onClick={recording ? stopRecording : startRecording}
            aria-label={recording ? "Stop recording" : "Record a voice note"}
            disabled={busy}
          >
            {recording ? <Square size={17} fill="currentColor" /> : <Mic size={20} />}
          </button>
          <button className="composer__send" type="submit" aria-label="Send message" disabled={!text.trim() || busy}>
            <ArrowUp size={20} strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </main>
  );
}
