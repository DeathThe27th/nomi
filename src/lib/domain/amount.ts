export function parseTokenAmount(input: string, decimals: number): bigint {
  const value = input.trim();
  const match = /^(?:0|[1-9]\d*)(?:\.(\d+))?$/.exec(value);
  if (!match) throw new Error("Enter a valid amount");

  const fraction = match[1] ?? "";
  if (fraction.length > decimals) throw new Error("Amount has too many decimal places");

  const [whole = "0"] = value.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0");
  const amount = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedFraction || "0");
  if (amount <= 0n) throw new Error("Amount must be greater than zero");
  return amount;
}

export function calculateRemainingBalance(balance: bigint, spend: bigint, fee = 0n): bigint {
  const total = spend + fee;
  if (total > balance) throw new Error("Insufficient balance");
  return balance - total;
}
