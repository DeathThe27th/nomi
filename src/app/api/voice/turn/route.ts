import { NextResponse } from "next/server";
import { applyAgentTurn } from "@/lib/agent/orchestrator";
import { signPlanToken, verifyPlanToken } from "@/lib/agent/plan-token";
import { understandAudioTurn } from "@/lib/ai/gemini";
import type { Contact } from "@/lib/domain/contacts";
import { sendPrivyNativeTransfer } from "@/lib/privy/transfer";
import { verifyShortcutToken } from "@/lib/shortcut/shortcut-token";
import { getNativeBalance, xLayerPublicClient } from "@/lib/wallet/balance";
import { executeApprovedTransfer } from "@/lib/wallet/executor";

export const runtime = "nodejs";
export const maxDuration = 60;
const VOICE_LIMIT_WEI = 50_000_000_000_000_000n;

function safeVoiceError(error: unknown): string {
  if (!(error instanceof Error)) return "Nomi could not process this recording";
  const safeMessages = [
    "Shortcut pairing is invalid or expired",
    "Record a voice note first",
    "Unsupported audio format",
    "The recording is empty",
    "The recording is too large",
    "Insufficient balance",
    "This amount needs stronger approval",
    "There is no transaction waiting for confirmation",
  ];
  return safeMessages.includes(error.message)
    ? error.message
    : "Nomi could not safely complete that request. Please try again.";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const token = form.get("shortcutToken");
    const audio = form.get("audio");
    const secret = process.env.NOMI_SESSION_SECRET;
    if (typeof token !== "string" || !secret) throw new Error("Shortcut is not paired");
    if (!(audio instanceof File) || !audio.size) throw new Error("Record a voice note first");
    const paired = await verifyShortcutToken(token, secret);
    const timestamp = new Date().toISOString();
    const contacts: Contact[] = paired.contacts.map((contact, index) => ({
      id: `shortcut-${index}`,
      name: contact.name,
      address: contact.address as `0x${string}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    const rawPlanToken = form.get("planToken");
    const currentPlan = typeof rawPlanToken === "string" && rawPlanToken
      ? await verifyPlanToken(rawPlanToken, paired.userId, secret)
      : null;
    const balanceWei = await getNativeBalance(paired.walletAddress);
    const turn = await understandAudioTurn({
      bytes: new Uint8Array(await audio.arrayBuffer()),
      mimeType: audio.type,
      context: {
        hasPendingPlan: currentPlan?.status === "AWAITING_CONFIRMATION",
        supportedContacts: contacts.map((contact) => contact.name),
        pendingPlanSummary: currentPlan
          ? `${currentPlan.actions[0].amount} OKB to ${currentPlan.actions[0].recipient.address}`
          : undefined,
      },
    });
    let result = await applyAgentTurn({ turn, currentPlan, contacts, walletBalanceWei: balanceWei });
    if (result.shouldExecute && result.plan) {
      const approvedPlan = result.plan;
      const completedPlan = await executeApprovedTransfer({
        plan: approvedPlan,
        balanceWei,
        policy: {
          maxPerTransactionWei: VOICE_LIMIT_WEI,
          expiresAt: new Date(Date.now() + 60_000),
          revoked: false,
        },
        send: async ({ to, value }) => {
          const hash = await sendPrivyNativeTransfer({
            userId: paired.userId,
            walletAddress: paired.walletAddress,
            recipient: to,
            valueWei: value,
            idempotencyKey: `nomi-shortcut-${approvedPlan.planId}`,
          });
          const receipt = await xLayerPublicClient.waitForTransactionReceipt({ hash, timeout: 45_000 });
          if (receipt.status !== "success") throw new Error("Transaction reverted");
          return hash;
        },
      });
      result = { ...result, plan: completedPlan };
      const action = completedPlan.actions[0];
      const name = action.recipient.kind === "contact" ? action.recipient.name : `${action.recipient.address.slice(0, 6)}…${action.recipient.address.slice(-4)}`;
      result.spokenResponse = `Done. I sent ${action.amount} OKB to ${name}.`;
    }
    const nextPlanToken = result.plan?.status === "AWAITING_CONFIRMATION"
      ? await signPlanToken(result.plan, paired.userId, secret)
      : null;
    return NextResponse.json({
      spokenResponse: result.spokenResponse,
      requiresUserResponse: result.requiresUserResponse,
      transcript: turn.transcript ?? null,
      planToken: nextPlanToken,
      conversationId: result.plan?.planId ?? crypto.randomUUID(),
      transactionHash: result.plan?.transactionHash ?? null,
      status: result.plan?.status ?? "IDLE",
    });
  } catch (error) {
    const message = safeVoiceError(error);
    return NextResponse.json({ spokenResponse: message, requiresUserResponse: true, error: message }, { status: 400 });
  }
}
