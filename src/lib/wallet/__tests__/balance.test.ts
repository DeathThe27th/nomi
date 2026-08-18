import { describe, expect, it, vi } from "vitest";
import { getNativeBalance } from "../balance";

describe("real wallet balance reader", () => {
  it("returns wei from the configured chain client", async () => {
    const readBalance = vi.fn().mockResolvedValue(123n);
    const result = await getNativeBalance(
      "0x1111111111111111111111111111111111111111",
      readBalance,
    );
    expect(result).toBe(123n);
    expect(readBalance).toHaveBeenCalledWith(
      "0x1111111111111111111111111111111111111111",
    );
  });

  it("rejects an invalid address before making a network request", async () => {
    const readBalance = vi.fn();
    await expect(getNativeBalance("bad-address", readBalance)).rejects.toThrow(
      "Enter a valid wallet address",
    );
    expect(readBalance).not.toHaveBeenCalled();
  });
});
