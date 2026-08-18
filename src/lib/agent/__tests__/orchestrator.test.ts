import { describe, expect, it } from "vitest";
import { applyAgentTurn } from "../orchestrator";
import type { Contact } from "@/lib/domain/contacts";

const contacts: Contact[] = [
  {
    id: "alex",
    name: "Alex",
    address: "0x1111111111111111111111111111111111111111",
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z",
  },
];
const now = new Date("2026-08-18T00:00:00.000Z");

describe("conversation orchestrator", () => {
  it("resolves a contact and creates a real pending plan", async () => {
    const result = await applyAgentTurn({
      turn: {
        turnType: "create_plan",
        spokenResponse: "I’ll prepare that transfer.",
        requiresUserResponse: true,
        intent: { type: "transfer", token: "OKB", amount: "0.02", recipientReference: "Alex" },
      },
      currentPlan: null,
      contacts,
      walletBalanceWei: 1_000_000_000_000_000_000n,
      now,
    });
    expect(result.plan?.actions[0].recipient).toMatchObject({ kind: "contact", name: "Alex" });
    expect(result.plan?.status).toBe("AWAITING_CONFIRMATION");
    expect(result.shouldExecute).toBe(false);
  });

  it("does not approve when yes also changes the amount", async () => {
    const created = await applyAgentTurn({
      turn: {
        turnType: "create_plan",
        spokenResponse: "Confirm?",
        requiresUserResponse: true,
        intent: { type: "transfer", token: "OKB", amount: "0.02", recipientReference: "Alex" },
      },
      currentPlan: null,
      contacts,
      walletBalanceWei: 1_000_000_000_000_000_000n,
      now,
    });
    const modified = await applyAgentTurn({
      turn: {
        turnType: "modify_plan",
        spokenResponse: "Updated to 0.05 OKB. Confirm?",
        requiresUserResponse: true,
        intent: { type: "transfer", token: "OKB", amount: "0.05", recipientReference: "Alex" },
      },
      currentPlan: created.plan,
      contacts,
      walletBalanceWei: 1_000_000_000_000_000_000n,
      now: new Date(now.getTime() + 1000),
    });
    expect(modified.plan?.status).toBe("AWAITING_CONFIRMATION");
    expect(modified.plan?.actions[0].amount).toBe("0.05");
    expect(modified.shouldExecute).toBe(false);
  });

  it("marks only the unchanged current plan for execution after yes", async () => {
    const created = await applyAgentTurn({
      turn: {
        turnType: "create_plan",
        spokenResponse: "Confirm?",
        requiresUserResponse: true,
        intent: { type: "transfer", token: "OKB", amount: "0.02", recipientReference: "Alex" },
      },
      currentPlan: null,
      contacts,
      walletBalanceWei: 1_000_000_000_000_000_000n,
      now,
    });
    const confirmed = await applyAgentTurn({
      turn: {
        turnType: "confirm",
        spokenResponse: "Confirmed.",
        requiresUserResponse: false,
      },
      currentPlan: created.plan,
      contacts,
      walletBalanceWei: 1_000_000_000_000_000_000n,
      now: new Date(now.getTime() + 1000),
    });
    expect(confirmed.plan?.status).toBe("APPROVED");
    expect(confirmed.shouldExecute).toBe(true);
  });

  it("answers a balance query without losing the pending plan", async () => {
    const result = await applyAgentTurn({
      turn: {
        turnType: "read_query",
        spokenResponse: "Checking your balance.",
        requiresUserResponse: false,
        intent: { type: "get_balance", token: "OKB" },
      },
      currentPlan: null,
      contacts,
      walletBalanceWei: 1_250_000_000_000_000_000n,
      now,
    });
    expect(result.spokenResponse).toContain("1.25 OKB");
    expect(result.plan).toBeNull();
  });

  it("asks for clarification when financial audio confidence is low", async () => {
    const result = await applyAgentTurn({
      turn: {
        turnType: "create_plan",
        spokenResponse: "I may have heard 0.02.",
        requiresUserResponse: true,
        confidence: 0.42,
        intent: { type: "transfer", token: "OKB", amount: "0.02", recipientReference: "Alex" },
      },
      currentPlan: null,
      contacts,
      walletBalanceWei: 1_000_000_000_000_000_000n,
      now,
    });
    expect(result.plan).toBeNull();
    expect(result.spokenResponse).toContain("didn’t catch the amount or recipient clearly");
  });

  it("asks for clarification instead of inventing an unknown contact", async () => {
    const result = await applyAgentTurn({
      turn: {
        turnType: "create_plan",
        spokenResponse: "I’ll send that to Jordan.",
        requiresUserResponse: true,
        intent: { type: "transfer", token: "OKB", amount: "0.02", recipientReference: "Jordan" },
      },
      currentPlan: null,
      contacts,
      walletBalanceWei: 1_000_000_000_000_000_000n,
      now,
    });
    expect(result.plan).toBeNull();
    expect(result.spokenResponse).toContain("Jordan isn’t in your address book");
  });
});
