import { toHex } from "viem";
import { getAuthorizationContext, getPrivyClient } from "./server";
import { XLAYER_CAIP2 } from "@/lib/wallet/x-layer";

export async function sendPrivyNativeTransfer({
  userId,
  walletAddress,
  recipient,
  valueWei,
  idempotencyKey,
}: {
  userId: string;
  walletAddress: string;
  recipient: `0x${string}`;
  valueWei: bigint;
  idempotencyKey: string;
}): Promise<`0x${string}`> {
  const privy = getPrivyClient();
  const owner = await privy.users().getByWalletAddress({ address: walletAddress });
  if (owner.id !== userId) throw new Error("This wallet does not belong to the signed-in user");

  const wallet = await privy.wallets().getWalletByAddress({ address: walletAddress });
  const { hash } = await privy.wallets().ethereum().sendTransaction(wallet.id, {
    caip2: XLAYER_CAIP2,
    params: {
      transaction: {
        to: recipient,
        value: toHex(valueWei),
        chain_id: 1952,
      },
    },
    authorization_context: getAuthorizationContext(),
    idempotency_key: idempotencyKey,
  });
  return hash as `0x${string}`;
}
