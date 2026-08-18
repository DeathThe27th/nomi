"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { xLayerTestnet } from "@/lib/wallet/x-layer";

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) {
    return <div role="alert">Nomi wallet login is not configured.</div>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        defaultChain: xLayerTestnet,
        supportedChains: [xLayerTestnet],
        loginMethods: ["email", "google"],
        appearance: {
          theme: "light",
          accentColor: "#11100f",
          logo: "/nomi-mark.svg",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
