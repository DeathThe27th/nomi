import { z } from "zod";

export const TransferIntentSchema = z
  .object({
    type: z.literal("transfer"),
    token: z.literal("OKB"),
    amount: z.string().min(1).max(80),
    recipientReference: z.string().min(1).max(80),
  })
  .strict();

export const BalanceIntentSchema = z
  .object({
    type: z.literal("get_balance"),
    token: z.literal("OKB"),
  })
  .strict();

export const ModifyAmountIntentSchema = z
  .object({
    type: z.literal("modify_amount"),
    amount: z.string().min(1).max(80),
  })
  .strict();

export const AgentIntentSchema = z.discriminatedUnion("type", [
  TransferIntentSchema,
  BalanceIntentSchema,
  ModifyAmountIntentSchema,
]);

export const AgentTurnSchema = z
  .object({
    turnType: z.enum([
      "greeting",
      "read_query",
      "create_plan",
      "modify_plan",
      "confirm",
      "cancel",
      "clarify",
      "unsupported",
    ]),
    spokenResponse: z.string().min(1).max(600),
    transcript: z.string().min(1).max(1200).optional(),
    requiresUserResponse: z.boolean(),
    intent: AgentIntentSchema.optional(),
    confidence: z.number().min(0).max(1).optional(),
  })
  .strict();

export const TransferRecipientSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("contact"),
      name: z.string().min(1),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    })
    .strict(),
  z
    .object({
      kind: z.literal("address"),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    })
    .strict(),
]);

export const TransferActionSchema = z
  .object({
    type: z.literal("transfer"),
    token: z.literal("OKB"),
    amount: z.string(),
    amountWei: z.string().regex(/^\d+$/),
    recipient: TransferRecipientSchema,
    chainId: z.literal(1952),
  })
  .strict();

export const TransactionPlanSchema = z
  .object({
    planId: z.string().min(1),
    revision: z.number().int().nonnegative(),
    status: z.enum([
      "AWAITING_CONFIRMATION",
      "APPROVED",
      "EXECUTING",
      "COMPLETED",
      "CANCELLED",
      "FAILED",
    ]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    actions: z.array(TransferActionSchema).length(1),
    transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
    failureReason: z.string().optional(),
  })
  .strict();

export type AgentTurn = z.infer<typeof AgentTurnSchema>;
export type TransactionPlan = z.infer<typeof TransactionPlanSchema>;
export type TransferRecipient = z.infer<typeof TransferRecipientSchema>;
