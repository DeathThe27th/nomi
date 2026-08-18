import { describe, expect, it, vi } from "vitest";
import { understandAudioTurn, generateWithModelFallback } from "../gemini";

describe("Gemini audio understanding", () => {
  it("sends raw audio and validates the structured financial intent", async () => {
    const generate = vi.fn().mockResolvedValue(
      JSON.stringify({
        turnType: "create_plan",
        spokenResponse: "I’ll prepare a transfer of 0.02 OKB to Alex.",
        requiresUserResponse: true,
        confidence: 0.98,
        intent: {
          type: "transfer",
          token: "OKB",
          amount: "0.02",
          recipientReference: "Alex",
        },
      }),
    );

    const result = await understandAudioTurn({
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: "audio/mpeg",
      context: { hasPendingPlan: false, supportedContacts: ["Alex"] },
      generate,
    });

    expect(result.intent).toMatchObject({ type: "transfer", amount: "0.02" });
    expect(generate).toHaveBeenCalledOnce();
    expect(generate.mock.calls[0][0].audioBase64).toBe("AQID");
  });

  it("rejects unsupported files before calling Gemini", async () => {
    const generate = vi.fn();
    await expect(
      understandAudioTurn({
        bytes: new Uint8Array([1]),
        mimeType: "text/plain",
        context: { hasPendingPlan: false, supportedContacts: [] },
        generate,
      }),
    ).rejects.toThrow("Unsupported audio format");
    expect(generate).not.toHaveBeenCalled();
  });

  it("rejects malformed model output instead of inventing a result", async () => {
    const generate = vi.fn().mockResolvedValue('{"turnType":"create_plan","calldata":"0xdead"}');
    await expect(
      understandAudioTurn({
        bytes: new Uint8Array([1]),
        mimeType: "audio/webm",
        context: { hasPendingPlan: false, supportedContacts: [] },
        generate,
      }),
    ).rejects.toThrow("Nomi could not safely understand that recording");
  });

  it("falls back to the secondary stable model on temporary high demand", async () => {
    const call = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("unavailable"), { status: 503 }))
      .mockResolvedValueOnce("safe response");
    await expect(
      generateWithModelFallback(["gemini-3.7-flash", "gemini-3.6-flash"], call),
    ).resolves.toBe("safe response");
    expect(call.mock.calls.map(([model]) => model)).toEqual([
      "gemini-3.7-flash",
      "gemini-3.6-flash",
    ]);
  });

  it("does not hide a non-transient Gemini failure", async () => {
    const call = vi.fn().mockRejectedValue(Object.assign(new Error("bad request"), { status: 400 }));
    await expect(
      generateWithModelFallback(["gemini-3.7-flash", "gemini-3.6-flash"], call),
    ).rejects.toThrow("bad request");
    expect(call).toHaveBeenCalledOnce();
  });
});
