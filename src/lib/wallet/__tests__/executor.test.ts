import { describe, expect, it, vi } from "vitest";
import { createTransferPlan, approveCurrentPlan } from "@/lib/domain/conversation";
import { executeApprovedTransfer, validateVoicePolicy } from "../executor";
import { xLayerTestnet } from "../x-layer";

const now = new Date("2026-08-18T00:00:00.000Z");
const recipient = {
  kind: "address" as const,
  address: "0x1111111111111111111111111111111111111111" as const,
};

function approvedPlan(amount = "0.02") {
  const pending = createTransferPlan({ amount, recipient, now });
  return approveCurrentPlan(pending, pending.planId, new Date(now.getTime() + 1000));
}

describe("X Layer wallet execution", () => {
  it("uses the current X Layer Testnet configuration", () => {
    expect(xLayerTestnet.id).toBe(1952);
    expect(xLayerTestnet.nativeCurrency.symbol).toBe("OKB");
    expect(xLayerTestnet.rpcUrls.default.http[0]).toMatch(/^https:\/\//);
  });

  it("rejects transfers over the configured voice limit", () => {
    expect(() =>
      validateVoicePolicy(approvedPlan("0.06"), {
        maxPerTransactionWei: 50_000_000_000_000_000n,
        expiresAt: new Date(now.getTime() + 60_000),
        revoked: false,
      }, now),
    ).toThrow("This amount needs stronger approval");
  });

  it("rejects expired and revoked voice permission", () => {
    const plan = approvedPlan();
    expect(() =>
      validateVoicePolicy(plan, {
        maxPerTransactionWei: 50_000_000_000_000_000n,
        expiresAt: new Date(now.getTime() - 1),
        revoked: false,
      }, now),
    ).toThrow("Voice permission expired");
    expect(() =>
      validateVoicePolicy(plan, {
        maxPerTransactionWei: 50_000_000_000_000_000n,
        expiresAt: new Date(now.getTime() + 60_000),
        revoked: true,
      }, now),
    ).toThrow("Voice permission was revoked");
  });

  it("checks real balance and returns the executor's real hash", async () => {
    const send = vi.fn().mockResolvedValue(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    const plan = approvedPlan();
    const result = await executeApprovedTransfer({
      plan,
      balanceWei: 1_000_000_000_000_000_000n,
      policy: {
        maxPerTransactionWei: 50_000_000_000_000_000n,
        expiresAt: new Date(now.getTime() + 60_000),
        revoked: false,
      },
      now,
      send,
    });
    expect(send).toHaveBeenCalledWith({
      chainId: 1952,
      to: recipient.address,
      value: 20_000_000_000_000_000n,
    });
    expect(result.status).toBe("COMPLETED");
    expect(result.transactionHash).toBe(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
  });
});
