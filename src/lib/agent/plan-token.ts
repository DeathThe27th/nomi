import { jwtVerify, SignJWT } from "jose";
import { TransactionPlanSchema, type TransactionPlan } from "@/lib/domain/schemas";

function key(secret: string): Uint8Array {
  if (secret.length < 32) throw new Error("Nomi session secret is too short");
  return Buffer.from(secret, "utf8");
}

export async function signPlanToken(
  plan: TransactionPlan,
  userId: string,
  secret: string,
): Promise<string> {
  return new SignJWT({ plan })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuer("nomi")
    .setAudience("nomi-plan")
    .setIssuedAt()
    .setExpirationTime(Math.floor(new Date(plan.expiresAt).getTime() / 1000))
    .sign(key(secret));
}

export async function verifyPlanToken(
  token: string,
  userId: string,
  secret: string,
): Promise<TransactionPlan> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      issuer: "nomi",
      audience: "nomi-plan",
    });
    if (payload.sub !== userId) throw new Error("Transaction plan does not belong to this user");
    return TransactionPlanSchema.parse(payload.plan);
  } catch (error) {
    if (error instanceof Error && error.message === "Transaction plan does not belong to this user") {
      throw error;
    }
    throw new Error("Transaction plan could not be verified");
  }
}
