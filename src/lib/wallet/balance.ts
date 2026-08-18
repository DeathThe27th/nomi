import { createPublicClient, getAddress, http, isAddress } from "viem";
import { xLayerTestnet } from "./x-layer";

export const xLayerPublicClient = createPublicClient({
  chain: xLayerTestnet,
  transport: http(),
});

export type ReadNativeBalance = (address: `0x${string}`) => Promise<bigint>;

const readFromXLayer: ReadNativeBalance = (address) =>
  xLayerPublicClient.getBalance({ address });

export async function getNativeBalance(
  address: string,
  readBalance: ReadNativeBalance = readFromXLayer,
): Promise<bigint> {
  if (!isAddress(address, { strict: false })) throw new Error("Enter a valid wallet address");
  return readBalance(getAddress(address));
}
