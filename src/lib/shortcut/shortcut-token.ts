import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

const ShortcutPayloadSchema = z
  .object({
    userId: z.string().startsWith("did:privy:"),
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    contacts: z
      .array(
        z
          .object({
            name: z.string().min(1).max(40),
            address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
          })
          .strict(),
      )
      .max(20),
  })
  .strict();

export type ShortcutPayload = z.infer<typeof ShortcutPayloadSchema>;

function key(secret: string): Uint8Array {
  if (secret.length < 32) throw new Error("Nomi session secret is too short");
  return Buffer.from(secret, "utf8");
}

export async function createShortcutToken(
  payload: ShortcutPayload,
  secret: string,
  expiresIn: string | number = "7d",
): Promise<string> {
  const safe = ShortcutPayloadSchema.parse(payload);
  return new SignJWT(safe)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer("nomi")
    .setAudience("nomi-shortcut")
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key(secret));
}

export async function verifyShortcutToken(token: string, secret: string): Promise<ShortcutPayload> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      issuer: "nomi",
      audience: "nomi-shortcut",
    });
    return ShortcutPayloadSchema.parse({
      userId: payload.userId,
      walletAddress: payload.walletAddress,
      contacts: payload.contacts,
    });
  } catch {
    throw new Error("Shortcut pairing is invalid or expired");
  }
}
