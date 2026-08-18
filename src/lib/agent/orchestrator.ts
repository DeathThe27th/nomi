import { formatEther, getAddress, isAddress } from "viem";
import { calculateRemainingBalance, parseTokenAmount } from "@/lib/domain/amount";
import { resolveContact, type Contact } from "@/lib/domain/contacts";
import {
  approveCurrentPlan,
  cancelCurrentPlan,
  createTransferPlan,
  modifyTransferAmount,
  modifyTransferPlan,
} from "@/lib/domain/conversation";
import type { AgentTurn, TransactionPlan, TransferRecipient } from "@/lib/domain/schemas";

export type AgentTurnResult = {
  spokenResponse: string;
  requiresUserResponse: boolean;
  plan: TransactionPlan | null;
  shouldExecute: boolean;
};

function recipientFromReference(contacts: Contact[], reference: string): TransferRecipient | null {
  const contact = resolveContact(contacts, reference);
  if (contact) {
    return { kind: "contact", name: contact.name, address: contact.address };
  }
  if (isAddress(reference, { strict: false })) {
    return { kind: "address", address: getAddress(reference) };
  }
  return null;
}

function formatBalance(balanceWei: bigint): string {
  const value = formatEther(balanceWei);
  const [whole, fraction = ""] = value.split(".");
  const usefulFraction = fraction.slice(0, 6).replace(/0+$/, "");
  return usefulFraction ? `${whole}.${usefulFraction}` : whole;
}

export async function applyAgentTurn({
  turn,
  currentPlan,
  contacts,
  walletBalanceWei,
  now = new Date(),
}: {
  turn: AgentTurn;
  currentPlan: TransactionPlan | null;
  contacts: Contact[];
  walletBalanceWei: bigint;
  now?: Date;
}): Promise<AgentTurnResult> {
  if (
    (turn.turnType === "create_plan" || turn.turnType === "modify_plan" || turn.turnType === "confirm") &&
    turn.confidence !== undefined &&
    turn.confidence < 0.8
  ) {
    return {
      spokenResponse: "I didn’t catch the amount or recipient clearly enough. Please say the full instruction again.",
      requiresUserResponse: true,
      plan: currentPlan,
      shouldExecute: false,
    };
  }

  if (turn.turnType === "read_query" && turn.intent?.type === "get_balance") {
    return {
      spokenResponse: `You have ${formatBalance(walletBalanceWei)} OKB available on X Layer Testnet.`,
      requiresUserResponse: false,
      plan: currentPlan,
      shouldExecute: false,
    };
  }

  if (turn.turnType === "create_plan" && turn.intent?.type === "transfer") {
    const recipient = recipientFromReference(contacts, turn.intent.recipientReference);
    if (!recipient) {
      return {
        spokenResponse: `${turn.intent.recipientReference} isn’t in your address book. Add them in Contacts or provide a complete wallet address.`,
        requiresUserResponse: true,
        plan: currentPlan,
        shouldExecute: false,
      };
    }
    const amountWei = parseTokenAmount(turn.intent.amount, 18);
    calculateRemainingBalance(walletBalanceWei, amountWei);
    const plan = createTransferPlan({ amount: turn.intent.amount, recipient, now });
    const name = recipient.kind === "contact" ? recipient.name : `${recipient.address.slice(0, 6)}…${recipient.address.slice(-4)}`;
    return {
      spokenResponse: `I’ll send ${turn.intent.amount} OKB to ${name} on X Layer Testnet. Confirm?`,
      requiresUserResponse: true,
      plan,
      shouldExecute: false,
    };
  }

  if (turn.turnType === "modify_plan" && turn.intent?.type === "transfer") {
    if (!currentPlan) throw new Error("There is no transaction waiting to be changed");
    const recipient = recipientFromReference(contacts, turn.intent.recipientReference);
    if (!recipient) {
      return {
        spokenResponse: `${turn.intent.recipientReference} isn’t in your address book. Add them in Contacts or provide a complete wallet address.`,
        requiresUserResponse: true,
        plan: currentPlan,
        shouldExecute: false,
      };
    }
    const amountWei = parseTokenAmount(turn.intent.amount, 18);
    calculateRemainingBalance(walletBalanceWei, amountWei);
    const plan = modifyTransferPlan(
      currentPlan,
      { amount: turn.intent.amount, recipient },
      now,
    );
    const name = recipient.kind === "contact" ? recipient.name : `${recipient.address.slice(0, 6)}…${recipient.address.slice(-4)}`;
    return {
      spokenResponse: `Updated. I’ll send ${turn.intent.amount} OKB to ${name}. Confirm the new plan?`,
      requiresUserResponse: true,
      plan,
      shouldExecute: false,
    };
  }

  if (turn.turnType === "modify_plan" && turn.intent?.type === "modify_amount") {
    if (!currentPlan) throw new Error("There is no transaction waiting to be changed");
    const amountWei = parseTokenAmount(turn.intent.amount, 18);
    calculateRemainingBalance(walletBalanceWei, amountWei);
    const plan = modifyTransferAmount(currentPlan, turn.intent.amount, now);
    return {
      spokenResponse: `Updated. I’ll send ${turn.intent.amount} OKB. Confirm the new plan?`,
      requiresUserResponse: true,
      plan,
      shouldExecute: false,
    };
  }

  if (turn.turnType === "confirm") {
    if (!currentPlan) throw new Error("There is no transaction waiting for confirmation");
    const plan = approveCurrentPlan(currentPlan, currentPlan.planId, now);
    return {
      spokenResponse: "Confirmed. I’m checking your permission and sending it now.",
      requiresUserResponse: false,
      plan,
      shouldExecute: true,
    };
  }

  if (turn.turnType === "cancel") {
    if (!currentPlan) {
      return {
        spokenResponse: "There is no pending transaction to cancel.",
        requiresUserResponse: false,
        plan: null,
        shouldExecute: false,
      };
    }
    return {
      spokenResponse: "Cancelled. I won’t send anything.",
      requiresUserResponse: false,
      plan: cancelCurrentPlan(currentPlan, now),
      shouldExecute: false,
    };
  }

  return {
    spokenResponse: turn.spokenResponse,
    requiresUserResponse: turn.requiresUserResponse,
    plan: currentPlan,
    shouldExecute: false,
  };
}
