import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getPrivyClient, verifyPrivyAccessToken } from "@/lib/privy/server";
import { createShortcutToken } from "@/lib/shortcut/shortcut-token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const claims = await verifyPrivyAccessToken(header.startsWith("Bearer ") ? header.slice(7) : "");
    const body = await request.json();
    if (!isAddress(body.walletAddress, { strict: false })) throw new Error("Invalid wallet");
    const owner = await getPrivyClient().users().getByWalletAddress({ address: body.walletAddress });
    if (owner.id !== claims.user_id) throw new Error("Invalid owner");
    const contacts = Array.isArray(body.contacts)
      ? body.contacts.slice(0, 20).map((contact: unknown) => {
          if (!contact || typeof contact !== "object") throw new Error("Invalid contact");
          const value = contact as { name?: unknown; address?: unknown };
          if (typeof value.name !== "string" || typeof value.address !== "string" || !isAddress(value.address, { strict: false })) throw new Error("Invalid contact");
          return { name: value.name.slice(0, 40), address: value.address as `0x${string}` };
        })
      : [];
    const secret = process.env.NOMI_SESSION_SECRET;
    if (!secret) throw new Error("Pairing unavailable");
    const shortcutToken = await createShortcutToken(
      { userId: claims.user_id, walletAddress: body.walletAddress, contacts },
      secret,
      "7d",
    );
    return NextResponse.json({ shortcutToken, expiresInDays: 7 });
  } catch {
    return NextResponse.json({ error: "Nomi could not create a Shortcut pairing" }, { status: 400 });
  }
}
