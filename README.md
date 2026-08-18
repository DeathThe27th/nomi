# Nomi

Nomi is a conversation-first financial assistant for X Layer. A user signs in, receives an integrated Privy wallet, sends a text or raw-audio instruction, reviews a deterministic transaction plan, and can confirm a restricted Testnet transfer by saying “Yes.”

## What works

- Privy email/Google login and automatic embedded EVM wallet creation
- X Layer Testnet native OKB balance reads
- Text and raw-audio turns through Gemini 3.7 Flash, with Gemini 3.6 Flash used only during temporary 3.7 capacity errors
- Zod-validated structured financial intents
- Saved contacts such as “Alex” resolved to deterministic EVM addresses
- Exact OKB transfer plans with five-minute expiry
- Conversational amount changes and cancellation
- “Yes” approval only for the current unchanged plan
- Privy delegated signer with an enforced 0.05 OKB, X Layer Testnet-only policy
- Real transaction broadcast, receipt monitoring, and explorer links
- Signer revocation
- Mobile-first PWA and Apple Shortcut voice endpoint

## Architecture

```text
PWA or Apple Shortcut
        │ raw audio / text
        ▼
Gemini 3.7 Flash ──> typed intent only
        │
        ▼
Nomi deterministic engine
  contact resolution · amount math · balance · plan state · confirmation
        │
        ▼
Privy delegated signer + enforced transfer policy
        │
        ▼
X Layer Testnet RPC and receipt
```

Gemini never supplies addresses, balances, calldata, transaction hashes, or execution results. The transaction engine resolves and validates all of those independently.

## Local setup

Requirements: Node.js 22+ and npm 10+.

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and supply the real development credentials.

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Environment variables

| Variable | Visibility | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Server only | Raw-audio and text understanding |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Browser safe | Privy login and embedded wallet |
| `PRIVY_APP_SECRET` | Server only | Privy server API |
| `PRIVY_KEY_QUORUM_ID` | Server only | Administrative reference to Nomi signer quorum |
| `PRIVY_AUTHORIZATION_PRIVATE_KEY` | Server only | Signs delegated Privy requests |
| `NEXT_PUBLIC_PRIVY_KEY_QUORUM_ID` | Browser safe | User-consented signer enrollment |
| `NEXT_PUBLIC_PRIVY_TRANSFER_POLICY_ID` | Browser safe | Attaches the restricted transfer policy |
| `NOMI_SESSION_SECRET` | Server only | Signs pending plans and Shortcut pairings |
| `NEXT_PUBLIC_APP_URL` | Browser safe | Live URL used in Shortcut instructions |

Never put server-only values in a `NEXT_PUBLIC_` variable.

## Privy setup

1. Create a Privy application.
2. Enable email and/or Google login.
3. Create a P-256 authorization key and 1-of-1 key quorum.
4. Create one Ethereum policy allowing only `eth_sendTransaction` when:
   - `chain_id` equals `1952`
   - native `value` is at most `0.05 OKB` (`0xb1a2bc2ec50000` wei)
5. Put the quorum and policy IDs into the matching environment variables.
6. Add localhost and the final Vercel domain to Privy’s allowed origins.

The user explicitly grants Nomi signer access from Settings. Revocation removes all Nomi signers from that embedded wallet.

## X Layer Testnet

- Chain ID: `1952`
- Native token: `OKB`
- RPC: `https://xlayertestrpc.okx.com`
- Explorer: `https://web3.okx.com/explorer/x-layer-testnet`
- Faucet: `https://www.okx.com/xlayer/faucet`

## Apple Shortcut

See [docs/APPLE-SHORTCUT.md](docs/APPLE-SHORTCUT.md) or open `/docs/apple-shortcut` in the deployed app.

The user creates a seven-day pairing in Nomi Settings. The Shortcut token identifies the Privy user, wallet, and current contact snapshot; it contains no wallet private key. Revoking Nomi’s signer access prevents transaction execution.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The live Gemini audio test is opt-in because it uses API quota:

```bash
RUN_LIVE_AI=1 npm test -- src/lib/ai/__tests__/gemini.live.test.ts
```

## Security model

- Owner wallet private keys are handled by Privy and never reach Nomi.
- Nomi’s authorization key is server-only.
- The Privy policy independently caps native Testnet transfers at 0.05 OKB.
- Pending plans are server-signed, user-bound, and expire after five minutes.
- A modified plan receives a new ID and must be confirmed again.
- Shortcut tokens expire after seven days.
- Raw audio is processed in memory and not stored by Nomi.
- Contacts and visible activity are currently stored in the user’s browser.

## Known limitations

- Testnet native OKB transfers are the only state-changing action in this hackathon build.
- Swaps are not included because a reliable X Layer Testnet liquidity route has not been proven.
- Shortcut contact changes require creating a new pairing token.
- Browser-local activity does not automatically synchronize between devices.
- Voice is not biometric authentication; restricted delegated permission is the security boundary.
- A real transfer requires the user’s embedded wallet to hold Testnet OKB for value and gas.

## Mainnet migration

Do not switch by changing only the chain ID. Before mainnet:

1. Complete an independent security review of the signer and policy architecture.
2. Create separate mainnet Privy credentials, authorization keys, and policies.
3. Reduce default limits and add server-side aggregate usage accounting.
4. Add durable, encrypted server-side activity and device-pairing storage.
5. Add stronger authentication for larger transactions.
6. Validate a real mainnet routing provider before enabling swaps.
7. Run a limited pilot with disposable amounts.
8. Update chain configuration to X Layer Mainnet (`196`) only after all checks pass.

## No fake data policy

Nomi never displays fabricated balances, quotes, transaction hashes, or success states. If an integration fails, the UI reports the failure instead of pretending the action completed.
