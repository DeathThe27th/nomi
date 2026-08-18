import { NextResponse } from "next/server";
import { formatEther } from "viem";
import { applyAgentTurn } from "@/lib/agent/orchestrator";
import { signPlanToken, verifyPlanToken } from "@/lib/agent/plan-token";
import { parseTurnFormData } from "@/lib/api/turn-request";
import { understandAudioTurn, understandTextTurn } from "@/lib/ai/gemini";
import { verifyPrivyAccessToken } from "@/lib/privy/server";
import { sendPrivyNativeTransfer } from "@/lib/privy/transfer";
import { getNativeBalance, xLayerPublicClient } from "@/lib/wallet/balance";
import { executeApprovedTransfer } from "@/lib/wallet/executor";

export const runtime = "nodejs";
export const maxDuration = 60;

const VOICE_LIMIT_WEI = 50_000_000_000_000_000n;

function sessionSecret(): string {
  const value = process.env.NOMI_SESSION_SECRET;
  if (!value) throw new Error("Nomi conversation security is not configured");
  return value;
}

function bearer(request: Request): string {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

function publicError(error: unknown): string {
  if (!(error instanceof Error)) return "Nomi could not process that request";
  const safe = [
    "Add a message or voice note",
    "Unsupported audio format",
    "The recording is empty",
    "The recording is too large",
    "Wallet address is invalid",
    "Address book data is invalid",
    "Insufficient balance",
    "This amount needs stronger approval",
    "Voice permission expired",
    "Voice permission was revoked",
    "Transaction plan could not be verified",
    "Transaction plan does not belong to this user",
    "There is no transaction waiting for confirmation",
  ];
  return safe.includes(error.message) ? error.message : "Nomi could not safely complete that request";
}

export async function POST(request: Request) {
  try {
    const claims = await verifyPrivyAccessToken(bearer(request));
    const form = parseTurnFormData(await request.formData());
    const currentPlan = form.planToken
      ? await verifyPlanToken(form.planToken, claims.user_id, sessionSecret())
      : null;
    const walletBalanceWei = await getNativeBalance(form.walletAddress);
    const pendingPlanSummary = currentPlan
      ? `${currentPlan.actions[0].amount} OKB to ${currentPlan.actions[0].recipient.address}`
      : undefined;
    const context = {
      hasPendingPlan: currentPlan?.status === "AWAITING_CONFIRMATION",
      supportedContacts: form.contacts.map((contact) => contact.name),
      pendingPlanSummary,
    };

    const turn = form.audio
      ? await understandAudioTurn({
          bytes: new Uint8Array(await form.audio.arrayBuffer()),
          mimeType: form.audio.type,
          context,
        })
      : await understandTextTurn({ text: form.text!, context });

    let result = await applyAgentTurn({
      turn,
      currentPlan,
      contacts: form.contacts,
      walletBalanceWei,
    });

    if (result.shouldExecute && result.plan) {
      const approvedPlan = result.plan;
      const completedPlan = await executeApprovedTransfer({
        plan: approvedPlan,
        balanceWei: walletBalanceWei,
        policy: {
          maxPerTransactionWei: VOICE_LIMIT_WEI,
          expiresAt: new Date(claims.expiration * 1000),
          revoked: false,
        },
        send: async ({ to, value }) => {
          const hash = await sendPrivyNativeTransfer({
            userId: claims.user_id,
            walletAddress: form.walletAddress,
            recipient: to,
            valueWei: value,
            idempotencyKey: `nomi-${approvedPlan.planId}`,
          });
          const receipt = await xLayerPublicClient.waitForTransactionReceipt({ hash, timeout: 45_000 });
          if (receipt.status !== "success") throw new Error("The transaction reverted");
          return hash;
        },
      });
      result = { ...result, plan: completedPlan };
      const action = completedPlan.actions[0];
      const recipient =
        action.recipient.kind === "contact"
          ? action.recipient.name
          : `${action.recipient.address.slice(0, 6)}…${action.recipient.address.slice(-4)}`;
      result.spokenResponse = `Done. I sent ${action.amount} OKB to ${recipient}.`;
    }

    const planToken =
      result.plan?.status === "AWAITING_CONFIRMATION"
        ? await signPlanToken(result.plan, claims.user_id, sessionSecret())
        : null;

    return NextResponse.json({
      ...result,
      transcript: turn.transcript ?? null,
      planToken,
      balance: `${formatEther(walletBalanceWei)} OKB`,
    });
  } catch (error) {
    return NextResponse.json({ error: publicError(error) }, { status: 400 });
  }
}
