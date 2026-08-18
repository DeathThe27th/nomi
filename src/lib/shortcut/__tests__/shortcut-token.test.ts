// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createShortcutToken, verifyShortcutToken } from "../shortcut-token";

const secret = "test-secret-that-is-long-enough-for-shortcut-signing";
const payload = {
  userId: "did:privy:user",
  walletAddress: "0x1111111111111111111111111111111111111111" as const,
  contacts: [{ name: "Alex", address: "0x2222222222222222222222222222222222222222" as const }],
};

describe("Apple Shortcut pairing token", () => {
  it("carries only the paired identity, wallet, and contact names", async () => {
    const token = await createShortcutToken(payload, secret, "7d");
    await expect(verifyShortcutToken(token, secret)).resolves.toMatchObject(payload);
  });

  it("rejects a modified pairing token", async () => {
    const token = await createShortcutToken(payload, secret, "7d");
    await expect(verifyShortcutToken(`${token.slice(0, -2)}xx`, secret)).rejects.toThrow(
      "Shortcut pairing is invalid or expired",
    );
  });
});
