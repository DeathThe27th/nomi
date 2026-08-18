import { calculateRemainingBalance } from "@/lib/domain/amount";
import { TransactionPlanSchema, type TransactionPlan } from "@/lib/domain/schemas";

export type VoicePolicy = {
  maxPerTransactionWei: bigint;
  expiresAt: Date;
  revoked: boolean;
};

export type NativeTransferRequest = {
  chainId: 1952;
  to: `0x${string}`;
  value: bigint;
};

export type SendNativeTransfer = (
  request: NativeTransferRequest,
) => Promise<`0x${string}`>;

export function validateVoicePolicy(
  plan: TransactionPlan,
  policy: VoicePolicy,
  now = new Date(),
): void {
  if (plan.status !== "APPROVED") throw new Error("The transaction is not approved");
  if (policy.revoked) throw new Error("Voice permission was revoked");
  if (now.getTime() >= policy.expiresAt.getTime()) throw new Error("Voice permission expired");

  const action = plan.actions[0];
  if (action.type !== "transfer" || action.token !== "OKB" || action.chainId !== 1952) {
    throw new Error("This action is not permitted");
  }
  if (BigInt(action.amountWei) > policy.maxPerTransactionWei) {
    throw new Error("This amount needs stronger approval");
  }
}

export async function executeApprovedTransfer({
  plan,
  balanceWei,
  estimatedFeeWei = 0n,
  policy,
  now = new Date(),
  send,
}: {
  plan: TransactionPlan;
  balanceWei: bigint;
  estimatedFeeWei?: bigint;
  policy: VoicePolicy;
  now?: Date;
  send: SendNativeTransfer;
}): Promise<TransactionPlan> {
  validateVoicePolicy(plan, policy, now);
  const action = plan.actions[0];
  const value = BigInt(action.amountWei);
  calculateRemainingBalance(balanceWei, value, estimatedFeeWei);

  const transactionHash = await send({
    chainId: 1952,
    to: action.recipient.address as `0x${string}`,
    value,
  });

  return TransactionPlanSchema.parse({
    ...plan,
    status: "COMPLETED",
    updatedAt: new Date().toISOString(),
    transactionHash,
  });
}
