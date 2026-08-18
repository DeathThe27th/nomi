import { PrivyClient, type AuthorizationContext } from "@privy-io/node";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

let client: PrivyClient | undefined;

export function getPrivyClient(): PrivyClient {
  client ??= new PrivyClient({
    appId: required("NEXT_PUBLIC_PRIVY_APP_ID"),
    appSecret: required("PRIVY_APP_SECRET"),
  });
  return client;
}

export function getAuthorizationContext(): AuthorizationContext {
  return {
    authorization_private_keys: [required("PRIVY_AUTHORIZATION_PRIVATE_KEY")],
  };
}

export async function verifyPrivyAccessToken(accessToken: string) {
  if (!accessToken) throw new Error("Sign in to Nomi first");
  return getPrivyClient().utils().auth().verifyAccessToken(accessToken);
}
