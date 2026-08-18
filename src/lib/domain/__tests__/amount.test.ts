import { describe, expect, it } from "vitest";
import { calculateRemainingBalance, parseTokenAmount } from "../amount";

describe("token amount calculations", () => {
  it("converts decimal OKB into exact wei without floating point math", () => {
    expect(parseTokenAmount("0.02", 18)).toBe(20_000_000_000_000_000n);
  });

  it("rejects zero, negative, and over-precision amounts", () => {
    expect(() => parseTokenAmount("0", 18)).toThrow("Amount must be greater than zero");
    expect(() => parseTokenAmount("-1", 18)).toThrow("Enter a valid amount");
    expect(() => parseTokenAmount("0.0000000000000000001", 18)).toThrow(
      "Amount has too many decimal places",
    );
  });

  it("calculates the real remaining balance deterministically", () => {
    expect(calculateRemainingBalance(100n, 35n)).toBe(65n);
    expect(() => calculateRemainingBalance(34n, 35n)).toThrow("Insufficient balance");
  });
});
