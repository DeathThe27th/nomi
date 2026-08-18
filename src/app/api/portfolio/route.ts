import { NextResponse } from "next/server";
import { formatEther, isAddress } from "viem";
import { getPrivyClient, verifyPrivyAccessToken } from "@/lib/privy/server";
import { getNativeBalance } from "@/lib/wallet/balance";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const claims = await verifyPrivyAccessToken(header.startsWith("Bearer ") ? header.slice(7) : "");
    const address = new URL(request.url).searchParams.get("address") ?? "";
    if (!isAddress(address, { strict: false })) throw new Error("Wallet address is invalid");
    const owner = await getPrivyClient().users().getByWalletAddress({ address });
    if (owner.id !== claims.user_id) throw new Error("Wallet ownership could not be verified");
    const wei = await getNativeBalance(address);
    return NextResponse.json({
      wei: wei.toString(),
      formatted: formatEther(wei),
      symbol: "OKB",
      chainId: 1952,
    });
  } catch {
    return NextResponse.json({ error: "Nomi could not load this wallet balance" }, { status: 400 });
  }
}
