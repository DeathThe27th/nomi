import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { understandAudioTurn } from "../gemini";

const live = process.env.RUN_LIVE_AI === "1" ? describe : describe.skip;

live("Gemini live audio", () => {
  it("understands a real spoken OKB transfer request", async () => {
    const audio = await readFile("/tmp/nomi-gemini-test.ogg");
    const turn = await understandAudioTurn({
      bytes: audio,
      mimeType: "audio/ogg",
      context: { hasPendingPlan: false, supportedContacts: ["Alex"] },
    });

    expect(turn.turnType).toBe("create_plan");
    expect(turn.confidence).toBeGreaterThanOrEqual(0.8);
    expect(turn.transcript?.toLowerCase()).toContain("alex");
    expect(turn.intent).toMatchObject({
      type: "transfer",
      token: "OKB",
      amount: "0.02",
      recipientReference: "Alex",
    });
  }, 30_000);
});
