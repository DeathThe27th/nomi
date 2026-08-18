import { describe, expect, it } from "vitest";
import {
  approveCurrentPlan,
  cancelCurrentPlan,
  createTransferPlan,
  modifyTransferAmount,
  modifyTransferPlan,
} from "../conversation";

const now = new Date("2026-08-18T00:00:00.000Z");
const recipient = {
  kind: "contact" as const,
  name: "Alex",
  address: "0x1111111111111111111111111111111111111111" as const,
};

describe("financial confirmation state", () => {
  it("creates a pending transfer plan that requires confirmation", () => {
    const plan = createTransferPlan({ amount: "0.02", recipient, now });
    expect(plan.status).toBe("AWAITING_CONFIRMATION");
    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0]).toMatchObject({ type: "transfer", amount: "0.02", token: "OKB" });
  });

  it("changes the amount and invalidates approval of the old plan", () => {
    const original = createTransferPlan({ amount: "0.02", recipient, now });
    const modified = modifyTransferAmount(original, "0.05", new Date(now.getTime() + 1000));

    expect(modified.planId).not.toBe(original.planId);
    expect(modified.status).toBe("AWAITING_CONFIRMATION");
    expect(modified.actions[0].amount).toBe("0.05");
    expect(modified.revision).toBe(original.revision + 1);
  });

  it("replaces the pending transfer and requires confirmation of the new recipient", () => {
    const original = createTransferPlan({ amount: "0.02", recipient, now });
    const newRecipient = {
      kind: "address" as const,
      address: "0x2222222222222222222222222222222222222222" as const,
    };
    const modified = modifyTransferPlan(
      original,
      { amount: "0.05", recipient: newRecipient },
      new Date(now.getTime() + 1000),
    );
    expect(modified.planId).not.toBe(original.planId);
    expect(modified.revision).toBe(1);
    expect(modified.status).toBe("AWAITING_CONFIRMATION");
    expect(modified.actions[0]).toMatchObject({ amount: "0.05", recipient: newRecipient });
  });

  it("approves only the current unchanged and unexpired plan", () => {
    const plan = createTransferPlan({ amount: "0.02", recipient, now });
    const approved = approveCurrentPlan(plan, plan.planId, new Date(now.getTime() + 1000));
    expect(approved.status).toBe("APPROVED");

    expect(() => approveCurrentPlan(plan, "old-plan", new Date(now.getTime() + 1000))).toThrow(
      "The transaction plan changed",
    );
    expect(() => approveCurrentPlan(plan, plan.planId, new Date(now.getTime() + 6 * 60 * 1000))).toThrow(
      "The transaction plan expired",
    );
  });

  it("cancels a pending plan so it can never be approved", () => {
    const plan = createTransferPlan({ amount: "0.02", recipient, now });
    const cancelled = cancelCurrentPlan(plan);
    expect(cancelled.status).toBe("CANCELLED");
    expect(() => approveCurrentPlan(cancelled, cancelled.planId, now)).toThrow(
      "There is no transaction waiting for confirmation",
    );
  });
});
