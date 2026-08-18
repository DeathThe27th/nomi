import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AgentTurnSchema, type AgentTurn } from "@/lib/domain/schemas";

const AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/flac",
]);
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MODELS = ["gemini-3.7-flash", "gemini-3.6-flash"] as const;

export type TurnContext = {
  hasPendingPlan: boolean;
  supportedContacts: string[];
  pendingPlanSummary?: string;
};

type GenerateInput = {
  audioBase64?: string;
  mimeType?: string;
  text?: string;
  systemPrompt: string;
  responseSchema: unknown;
};

export type GenerateStructuredTurn = (input: GenerateInput) => Promise<string>;

function systemPrompt(context: TurnContext): string {
  const pending = context.hasPendingPlan
    ? `A transaction is waiting for confirmation. Current plan: ${context.pendingPlanSummary ?? "available to the deterministic engine"}. A plain affirmative may return confirm. Any requested change must return modify_plan and must never return confirm in the same turn.`
    : "No transaction is currently waiting for confirmation. Never return confirm.";

  return `You are Nomi, a warm and concise voice financial assistant for X Layer Testnet.
Understand the user's natural language, including accents and conversational references.
Return only the requested structured object. For audio input, include a concise verbatim transcript in the transcript field. Never invent an address, balance, token, quote, transaction hash, calldata, or successful execution.
Supported actions in this MVP are checking the native OKB balance and transferring an exact amount of OKB.
Recipient names must be copied into recipientReference and resolved later by deterministic code.
Known contact names: ${context.supportedContacts.length ? context.supportedContacts.join(", ") : "none"}.
If an amount, recipient, or confirmation is unclear, return clarify and ask one short question. Never choose the higher-value interpretation.
${pending}`;
}

export async function generateWithModelFallback(
  models: readonly string[],
  call: (model: string) => Promise<string>,
): Promise<string> {
  let lastError: unknown;
  for (const model of models) {
    try {
      return await call(model);
    } catch (error) {
      lastError = error;
      const candidate = error as { status?: number; code?: number; message?: string };
      const message = candidate.message ?? "";
      const retryable =
        candidate.status === 429 ||
        candidate.status === 503 ||
        candidate.code === 429 ||
        candidate.code === 503 ||
        message.includes('"code":429') ||
        message.includes('"code":503');
      if (!retryable) throw error;
    }
  }
  throw lastError;
}

export const generateWithGemini: GenerateStructuredTurn = async ({
  audioBase64,
  mimeType,
  text,
  systemPrompt: instructions,
  responseSchema,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini is not configured");

  const ai = new GoogleGenAI({ apiKey });
  const parts = audioBase64
    ? [
        { text: "Understand this raw voice turn and return Nomi's structured response." },
        { inlineData: { data: audioBase64, mimeType: mimeType! } },
      ]
    : [{ text: text! }];

  return generateWithModelFallback(MODELS, async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: instructions,
        responseMimeType: "application/json",
        responseJsonSchema: responseSchema,
        temperature: 0.1,
      },
    });
    if (!response.text) throw new Error("Gemini returned no response");
    return response.text;
  });
};

function parseTurn(raw: string): AgentTurn {
  try {
    return AgentTurnSchema.parse(JSON.parse(raw));
  } catch {
    throw new Error("Nomi could not safely understand that recording");
  }
}

export async function understandAudioTurn({
  bytes,
  mimeType,
  context,
  generate = generateWithGemini,
}: {
  bytes: Uint8Array;
  mimeType: string;
  context: TurnContext;
  generate?: GenerateStructuredTurn;
}): Promise<AgentTurn> {
  const normalizedMime = mimeType.toLowerCase().split(";")[0].trim();
  if (!AUDIO_MIME_TYPES.has(normalizedMime)) throw new Error("Unsupported audio format");
  if (bytes.byteLength === 0) throw new Error("The recording is empty");
  if (bytes.byteLength > MAX_AUDIO_BYTES) throw new Error("The recording is too large");

  const raw = await generate({
    audioBase64: Buffer.from(bytes).toString("base64"),
    mimeType: normalizedMime,
    systemPrompt: systemPrompt(context),
    responseSchema: z.toJSONSchema(AgentTurnSchema),
  });
  return parseTurn(raw);
}

export async function understandTextTurn({
  text,
  context,
  generate = generateWithGemini,
}: {
  text: string;
  context: TurnContext;
  generate?: GenerateStructuredTurn;
}): Promise<AgentTurn> {
  const normalized = text.trim();
  if (!normalized) throw new Error("Enter a message");
  if (normalized.length > 1000) throw new Error("Message is too long");
  const raw = await generate({
    text: normalized,
    systemPrompt: systemPrompt(context),
    responseSchema: z.toJSONSchema(AgentTurnSchema),
  });
  return parseTurn(raw);
}
