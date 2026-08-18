import { isAddress } from "viem";
import { z } from "zod";
import type { Contact } from "@/lib/domain/contacts";

const ContactSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().min(1).max(40),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type TurnRequest = {
  text: string | null;
  audio: File | null;
  walletAddress: `0x${string}`;
  contacts: Contact[];
  planToken: string | null;
};

function field(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === "string" ? value : null;
}

export function parseTurnFormData(form: FormData): TurnRequest {
  const rawText = field(form, "text")?.trim() ?? "";
  const audioValue = form.get("audio");
  const audio = typeof File !== "undefined" && audioValue instanceof File ? audioValue : null;
  if (!rawText && !audio) throw new Error("Add a message or voice note");
  if (rawText.length > 1000) throw new Error("Message is too long");

  const walletAddress = field(form, "walletAddress") ?? "";
  if (!isAddress(walletAddress, { strict: false })) throw new Error("Wallet address is invalid");

  let contacts: Contact[];
  try {
    contacts = z.array(ContactSchema).max(20).parse(JSON.parse(field(form, "contacts") ?? "[]")) as Contact[];
  } catch {
    throw new Error("Address book data is invalid");
  }

  return {
    text: rawText || null,
    audio,
    walletAddress,
    contacts,
    planToken: field(form, "planToken") || null,
  };
}
