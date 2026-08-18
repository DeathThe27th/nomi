import { parseTokenAmount } from "./amount";
import {
  TransactionPlanSchema,
  type TransactionPlan,
  type TransferRecipient,
} from "./schemas";

const PLAN_TTL_MS = 5 * 60 * 1000;

function planIdentifier(): string {
  return `plan_${crypto.randomUUID()}`;
}

export function createTransferPlan({
  amount,
  recipient,
  now = new Date(),
}: {
  amount: string;
  recipient: TransferRecipient;
  now?: Date;
}): TransactionPlan {
  const amountWei = parseTokenAmount(amount, 18);
  const timestamp = now.toISOString();
  return TransactionPlanSchema.parse({
    planId: planIdentifier(),
    revision: 0,
    status: "AWAITING_CONFIRMATION",
    createdAt: timestamp,
    updatedAt: timestamp,
    expiresAt: new Date(now.getTime() + PLAN_TTL_MS).toISOString(),
    actions: [
      {
        type: "transfer",
        token: "OKB",
        amount,
        amountWei: amountWei.toString(),
        recipient,
        chainId: 1952,
      },
    ],
  });
}

export function modifyTransferAmount(
  plan: TransactionPlan,
  amount: string,
  now = new Date(),
): TransactionPlan {
  if (plan.status !== "AWAITING_CONFIRMATION") {
    throw new Error("There is no transaction waiting to be changed");
  }
  const amountWei = parseTokenAmount(amount, 18);
  return TransactionPlanSchema.parse({
    ...plan,
    planId: planIdentifier(),
    revision: plan.revision + 1,
    status: "AWAITING_CONFIRMATION",
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PLAN_TTL_MS).toISOString(),
    actions: [{ ...plan.actions[0], amount, amountWei: amountWei.toString() }],
    transactionHash: undefined,
    failureReason: undefined,
  });
}

export function modifyTransferPlan(
  plan: TransactionPlan,
  change: { amount: string; recipient: TransferRecipient },
  now = new Date(),
): TransactionPlan {
  if (plan.status !== "AWAITING_CONFIRMATION") {
    throw new Error("There is no transaction waiting to be changed");
  }
  const amountWei = parseTokenAmount(change.amount, 18);
  return TransactionPlanSchema.parse({
    ...plan,
    planId: planIdentifier(),
    revision: plan.revision + 1,
    status: "AWAITING_CONFIRMATION",
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PLAN_TTL_MS).toISOString(),
    actions: [
      {
        ...plan.actions[0],
        amount: change.amount,
        amountWei: amountWei.toString(),
        recipient: change.recipient,
      },
    ],
    transactionHash: undefined,
    failureReason: undefined,
  });
}

export function approveCurrentPlan(
  plan: TransactionPlan,
  approvedPlanId: string,
  now = new Date(),
): TransactionPlan {
  if (plan.status !== "AWAITING_CONFIRMATION") {
    throw new Error("There is no transaction waiting for confirmation");
  }
  if (approvedPlanId !== plan.planId) throw new Error("The transaction plan changed");
  if (now.getTime() >= new Date(plan.expiresAt).getTime()) {
    throw new Error("The transaction plan expired");
  }
  return TransactionPlanSchema.parse({
    ...plan,
    status: "APPROVED",
    updatedAt: now.toISOString(),
  });
}

export function cancelCurrentPlan(plan: TransactionPlan, now = new Date()): TransactionPlan {
  if (plan.status !== "AWAITING_CONFIRMATION") {
    throw new Error("There is no transaction waiting to cancel");
  }
  return TransactionPlanSchema.parse({
    ...plan,
    status: "CANCELLED",
    updatedAt: now.toISOString(),
  });
}
