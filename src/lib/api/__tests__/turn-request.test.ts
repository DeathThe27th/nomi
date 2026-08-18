import { describe, expect, it } from "vitest";
import { parseTurnFormData } from "../turn-request";

describe("agent turn request validation", () => {
  it("accepts a text turn with validated contacts and wallet", () => {
    const form = new FormData();
    form.set("text", "Send 0.02 OKB to Alex");
    form.set("walletAddress", "0x2222222222222222222222222222222222222222");
    form.set(
      "contacts",
      JSON.stringify([
        {
          id: "alex",
          name: "Alex",
          address: "0x1111111111111111111111111111111111111111",
          createdAt: "2026-08-18T00:00:00.000Z",
          updatedAt: "2026-08-18T00:00:00.000Z",
        },
      ]),
    );
    const result = parseTurnFormData(form);
    expect(result.text).toBe("Send 0.02 OKB to Alex");
    expect(result.contacts[0].name).toBe("Alex");
  });

  it("rejects requests with neither text nor audio", () => {
    const form = new FormData();
    form.set("walletAddress", "0x2222222222222222222222222222222222222222");
    form.set("contacts", "[]");
    expect(() => parseTurnFormData(form)).toThrow("Add a message or voice note");
  });

  it("rejects malformed contact data", () => {
    const form = new FormData();
    form.set("text", "hello");
    form.set("walletAddress", "0x2222222222222222222222222222222222222222");
    form.set("contacts", '[{"name":"Alex","address":"bad"}]');
    expect(() => parseTurnFormData(form)).toThrow("Address book data is invalid");
  });
});
