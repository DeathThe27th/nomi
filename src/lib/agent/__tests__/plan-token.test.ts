// @vitest-environment node
import { describe, expect, it } from "vitest";
import { signPlanToken, verifyPlanToken } from "../plan-token";
import { createTransferPlan } from "@/lib/domain/conversation";

const secret = "test-secret-that-is-long-enough-for-hmac-signing";
const plan = createTransferPlan({
  amount: "0.02",
  recipient: { kind: "address", address: "0x1111111111111111111111111111111111111111" },
  now: new Date("2026-08-18T00:00:00.000Z"),
});

describe("signed transaction plan tokens", () => {
  it("round-trips the exact pending plan", async () => {
    const token = await signPlanToken(plan, "did:privy:user", secret);
    const result = await verifyPlanToken(token, "did:privy:user", secret);
    expect(result).toEqual(plan);
  });

  it("rejects use by a different user", async () => {
    const token = await signPlanToken(plan, "did:privy:user", secret);
    await expect(verifyPlanToken(token, "did:privy:other", secret)).rejects.toThrow(
      "Transaction plan does not belong to this user",
    );
  });

  it("rejects tampering", async () => {
    const token = await signPlanToken(plan, "did:privy:user", secret);
    await expect(
      verifyPlanToken(`${token.slice(0, -1)}x`, "did:privy:user", secret),
    ).rejects.toThrow("Transaction plan could not be verified");
  });
});
