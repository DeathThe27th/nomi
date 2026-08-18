import { describe, expect, it } from "vitest";
import { AgentTurnSchema } from "../schemas";

describe("agent output schema", () => {
  it("accepts a typed transfer request without a model-provided address", () => {
    const result = AgentTurnSchema.parse({
      turnType: "create_plan",
      spokenResponse: "I’ll prepare that transfer.",
      requiresUserResponse: true,
      intent: {
        type: "transfer",
        token: "OKB",
        amount: "0.02",
        recipientReference: "Alex",
      },
    });
    expect(result.intent?.type).toBe("transfer");
  });

  it("rejects arbitrary calldata and model-invented transaction fields", () => {
    const result = AgentTurnSchema.safeParse({
      turnType: "create_plan",
      spokenResponse: "Done",
      requiresUserResponse: false,
      calldata: "0xdeadbeef",
    });
    expect(result.success).toBe(false);
  });
});
