# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Privy embedded EVM wallets, Gemini audio understanding, viem, Zod, Vitest, and Vercel.

## Users

People who want to carry out simple onchain financial actions without navigating a trading interface or repeatedly connecting a wallet. The first release is a hackathon MVP running on X Layer Testnet.

## Product Purpose

Nomi is a conversational onchain financial assistant. A user sends a voice note or text instruction, Nomi understands it, constructs and displays a deterministic transaction plan, accepts conversational changes, asks for confirmation, and executes a real permitted X Layer Testnet transaction.

## Positioning

Nomi combines a familiar messaging interface, an integrated wallet, saved human-readable contacts, and restricted voice-authorized execution. AI determines meaning; deterministic code validates and executes the transaction.

## Operating Context

- The primary interface is a mobile-first chat, similar in familiarity to a modern messaging assistant.
- Users can send voice notes or typed messages.
- Transaction plans appear as structured cards inside the conversation.
- The Apple Action Button launches an Apple Shortcut that records raw audio and talks to the same Nomi backend without opening the website.
- The public product includes a landing page. The signed-in app includes Chat, Activity, Contacts, and Settings.

## Capabilities and Constraints

- Privy creates an integrated user-owned EVM wallet.
- X Layer Testnet is the initial network.
- The first reliable state-changing action is a native OKB transfer.
- Users can save unique contact names mapped to validated wallet addresses and say commands such as “Send 0.02 OKB to Alex.”
- Nomi reads real wallet state and never invents balances, recipients, transaction hashes, or success states.
- A spoken “Yes” approves only the current unchanged, unexpired plan and only within delegated policy limits.
- Any modification creates a new plan and requires confirmation again.
- The owner wallet key is never stored by Nomi.
- No fake data, placeholder functionality, dummy success paths, or unsupported claims may ship.
- Raw audio is not stored by default.
- Swaps are a stretch feature and must not block a complete real-transfer demo.

## Brand Commitments

- Product name: Nomi.
- Greeting: “Hi, I’m Nomi, how can I assist you today?”
- Warm, direct, calm, trustworthy voice.
- Mobile-first and modern.
- Neutral black, white, and restrained accent palette.
- No gradients, neon Web3 styling, cluttered dashboards, or fake charts.
- The chat is the primary workspace; a large microphone appears only during recording.
- An original Nomi logo must ship with the product.

## Evidence on Hand

- Working X Layer Testnet public RPC access.
- Valid Gemini API credential.
- Privy app credential and authorization key material supplied for development.
- GitHub and Vercel accounts connected.
- No testimonials, customers, production volume, token prices, or commercial claims are available and none may be fabricated.

## Product Principles

1. Conversation should feel natural; financial authorization should remain deterministic.
2. Every onchain fact displayed to the user must come from a real source.
3. The user must always see exactly what Nomi understood before execution.
4. Voice access should be fast, but never bypass configured permissions.
5. Familiar interaction patterns should reduce cognitive load rather than imitate a trading terminal.

## Accessibility & Inclusion

The interface must support keyboard navigation, visible focus, screen-reader labels, sufficient contrast, reduced motion, large touch targets, clear error recovery, and layouts that tolerate long names and multilingual text.
