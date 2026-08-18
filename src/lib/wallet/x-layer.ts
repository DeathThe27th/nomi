import { defineChain } from "viem";

export const xLayerTestnet = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: {
    name: "OKB",
    symbol: "OKB",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://xlayertestrpc.okx.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "OKLink",
      url: "https://web3.okx.com/explorer/x-layer-testnet",
    },
  },
  testnet: true,
});

export const XLAYER_CAIP2 = "eip155:1952";
