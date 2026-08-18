"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePrivy, useSigners, useWallets } from "@privy-io/react-auth";
import {
  Activity,
  BookUser,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  LockKeyhole,
  MessageCircle,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import { formatEther } from "viem";
import { addContact, deleteContact, type Contact } from "@/lib/domain/contacts";
import type { TransactionPlan } from "@/lib/domain/schemas";
import { ChatWorkspace, type ChatMessage } from "./chat-workspace";

type Tab = "chat" | "activity" | "contacts" | "settings";
type ActivityEntry = {
  id: string;
  amount: string;
  recipient: string;
  address: string;
  hash: string;
  timestamp: string;
  status: "Completed";
};

type TurnResponse = {
  spokenResponse: string;
  transcript: string | null;
  requiresUserResponse: boolean;
  plan: TransactionPlan | null;
  planToken: string | null;
  balance: string;
  error?: string;
};

function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) setValue(JSON.parse(stored) as T);
      } catch {
        localStorage.removeItem(key);
      } finally {
        setLoaded(true);
      }
    });
  }, [key]);
  useEffect(() => {
    if (loaded) localStorage.setItem(key, JSON.stringify(value));
  }, [key, loaded, value]);
  return [value, setValue] as const;
}

function Landing({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="landing">
      <nav className="landing-nav" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Nomi home">
          <Image src="/nomi-mark.svg" alt="" width={38} height={38} />
          <span>Nomi</span>
        </a>
        <button className="button button--quiet" type="button" onClick={onLogin}>Sign in</button>
      </nav>

      <section className="hero" id="top">
        <div className="hero__copy">
          <h1>Your money.<br />In your own words.</h1>
          <p>
            Nomi turns a natural conversation into a clear, checked transaction on X Layer. You see the plan before anything moves.
          </p>
          <button className="button button--primary button--large" type="button" onClick={onLogin}>
            Meet Nomi <ArrowRight size={19} />
          </button>
          <div className="hero__trust"><ShieldCheck size={17} /> Testnet only · You stay in control</div>
        </div>

        <div className="hero-demo" aria-label="Example Nomi conversation">
          <div className="hero-demo__bar">
            <span><i /> Example conversation</span>
            <span>X Layer Testnet</span>
          </div>
          <div className="demo-message demo-message--user">Send 0.02 OKB to Alex.</div>
          <div className="demo-message demo-message--nomi">
            <Image src="/nomi-mark.svg" alt="" width={28} height={28} />
            <p>I’ll send 0.02 OKB to Alex. Confirm?</p>
          </div>
          <div className="demo-plan">
            <small>TRANSACTION PLAN</small>
            <strong>0.02 OKB</strong>
            <div><span className="token-dot">O</span><span>→</span><span><b>Alex</b><small>0x1234…abcd</small></span></div>
            <p>This is an example. Nomi uses your real wallet data after sign-in.</p>
          </div>
        </div>
      </section>

      <section className="landing-principles" aria-label="How Nomi works">
        <article><span>1</span><h2>Speak naturally</h2><p>Send a voice note or type. Change your mind without restarting.</p></article>
        <article><span>2</span><h2>See the exact plan</h2><p>Amount, recipient, network and status stay visible in the conversation.</p></article>
        <article><span>3</span><h2>Confirm, then move</h2><p>“Yes” works only for the unchanged plan and within your permission.</p></article>
      </section>
    </main>
  );
}

function ContactsPanel({ contacts, setContacts }: { contacts: Contact[]; setContacts: (value: Contact[]) => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setContacts(addContact(contacts, { name, address }));
      setName("");
      setAddress("");
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Contact could not be saved");
    }
  }

  return (
    <section className="panel-page">
      <div className="page-heading"><div><h1>Contacts</h1><p>Use names instead of reading wallet addresses aloud.</p></div></div>
      <form className="contact-form" onSubmit={submit}>
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex" maxLength={40} required /></label>
        <label>Wallet address<input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="0x…" spellCheck={false} required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button--primary" type="submit"><Plus size={18} /> Save contact</button>
      </form>
      <div className="contact-list">
        {contacts.length === 0 ? (
          <div className="empty-state"><BookUser size={26} /><h2>No contacts yet</h2><p>Add someone above, then say “Send 0.02 OKB to Alex.”</p></div>
        ) : contacts.map((contact) => (
          <article className="contact-row" key={contact.id}>
            <span className="contact-avatar">{contact.name.slice(0, 1).toUpperCase()}</span>
            <div><strong>{contact.name}</strong><code>{contact.address.slice(0, 8)}…{contact.address.slice(-6)}</code></div>
            <button type="button" aria-label={`Delete ${contact.name}`} onClick={() => setContacts(deleteContact(contacts, contact.id))}><Trash2 size={17} /></button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActivityPanel({ entries }: { entries: ActivityEntry[] }) {
  return (
    <section className="panel-page">
      <div className="page-heading"><div><h1>Activity</h1><p>Only transactions returned by X Layer appear here.</p></div></div>
      {entries.length === 0 ? (
        <div className="empty-state"><Activity size={26} /><h2>No transactions yet</h2><p>Completed Testnet transfers will appear here with their real explorer link.</p></div>
      ) : (
        <div className="activity-list">
          {entries.map((entry) => (
            <a key={entry.id} className="activity-row" href={`https://web3.okx.com/explorer/x-layer-testnet/tx/${entry.hash}`} target="_blank" rel="noreferrer">
              <span className="activity-icon"><ArrowRight size={18} /></span>
              <div><strong>Sent {entry.amount} OKB</strong><span>To {entry.recipient} · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.timestamp))}</span></div>
              <span className="activity-status"><Check size={14} /> {entry.status}</span>
              <ExternalLink size={16} />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsPanel({
  walletAddress,
  signerEnabled,
  enabling,
  onEnable,
  onRevoke,
  onCreatePairing,
  pairingToken,
  pairing,
}: {
  walletAddress: string;
  signerEnabled: boolean;
  enabling: boolean;
  onEnable: () => void;
  onRevoke: () => void;
  onCreatePairing: () => void;
  pairingToken: string | null;
  pairing: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="panel-page">
      <div className="page-heading"><div><h1>Settings</h1><p>Wallet, voice permission and quick access.</p></div></div>
      <div className="settings-groups">
        <section className="settings-section"><h2>Wallet</h2><div className="setting-row"><span><Wallet size={19} /><span><strong>Integrated wallet</strong><small>{walletAddress.slice(0, 10)}…{walletAddress.slice(-8)}</small></span></span><button type="button" onClick={async () => { await navigator.clipboard.writeText(walletAddress); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied" : <Copy size={17} />}</button></div><a className="setting-link" href="https://www.okx.com/xlayer/faucet" target="_blank" rel="noreferrer">Get Testnet OKB <ExternalLink size={15} /></a></section>
        <section className="settings-section"><h2>Voice authorization</h2><div className="authorization-summary"><LockKeyhole size={21} /><div><strong>{signerEnabled ? "Nomi access is active" : "Nomi access is off"}</strong><p>Native OKB transfers only · maximum 0.05 OKB · X Layer Testnet only.</p></div></div>{signerEnabled ? <button className="button button--danger" type="button" onClick={onRevoke}>Revoke Nomi access</button> : <button className="button button--primary" type="button" disabled={enabling} onClick={onEnable}>{enabling ? "Enabling…" : "Enable voice-confirmed transfers"}</button>}</section>
        <section className="settings-section">
          <h2>iPhone Action Button</h2>
          <p className="settings-copy">Use Nomi without opening the website. Pairing lasts seven days and can be disabled by revoking Nomi access.</p>
          <button className="button button--primary" type="button" onClick={onCreatePairing} disabled={!signerEnabled || pairing}>
            {pairing ? "Creating pairing…" : pairingToken ? "Create a new pairing" : "Pair Apple Shortcut"}
          </button>
          {pairingToken && (
            <div className="pairing-token">
              <span>Shortcut token</span>
              <code>{pairingToken}</code>
              <button type="button" onClick={() => navigator.clipboard.writeText(pairingToken)}>Copy token</button>
            </div>
          )}
          {!signerEnabled && <p className="settings-hint">Enable voice-confirmed transfers before pairing the Shortcut.</p>}
          <a className="setting-link" href="/docs/apple-shortcut" target="_blank">Open setup guide <ArrowRight size={15} /></a>
        </section>
      </div>
    </section>
  );
}

export function AppShell() {
  const { ready, authenticated, login, logout, getAccessToken } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { addSigners, removeSigners } = useSigners();
  const [tab, setTab] = useState<Tab>("chat");
  const [contacts, setContacts] = useStoredState<Contact[]>("nomi-contacts", []);
  const [messages, setMessages] = useStoredState<ChatMessage[]>("nomi-messages", []);
  const [activities, setActivities] = useStoredState<ActivityEntry[]>("nomi-activity", []);
  const [plan, setPlan] = useState<TransactionPlan | null>(null);
  const [planToken, setPlanToken] = useState<string | null>(null);
  const [balanceWei, setBalanceWei] = useState<bigint>(0n);
  const [busy, setBusy] = useState(false);
  const [signerEnabled, setSignerEnabled] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const wallet = useMemo(
    () => wallets.find((candidate) => candidate.walletClientType === "privy"),
    [wallets],
  );
  const walletAddress = wallet?.address ?? "";

  useEffect(() => {
    queueMicrotask(() => {
      setSignerEnabled(localStorage.getItem("nomi-signer-enabled") === "yes");
    });
  }, []);

  const loadBalance = useCallback(async () => {
    if (!walletAddress || !authenticated) return;
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/portfolio?address=${encodeURIComponent(walletAddress)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) setBalanceWei(BigInt(data.wei));
    } catch {
      setNotice("Your balance could not be refreshed. Try again shortly.");
    }
  }, [authenticated, getAccessToken, walletAddress]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBalance(), 0);
    return () => window.clearTimeout(timer);
  }, [loadBalance]);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  async function sendTurn(input: { text?: string; audio?: Blob }) {
    if (!walletAddress) return;
    setBusy(true);
    setNotice(null);
    if (input.text) setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: input.text!, kind: "text" }]);
    try {
      const token = await getAccessToken();
      const form = new FormData();
      if (input.text) form.set("text", input.text);
      if (input.audio) form.set("audio", input.audio, `nomi-voice-${Date.now()}.webm`);
      form.set("walletAddress", walletAddress);
      form.set("contacts", JSON.stringify(contacts));
      if (planToken) form.set("planToken", planToken);
      const response = await fetch("/api/agent/turn", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = (await response.json()) as TurnResponse;
      if (!response.ok || data.error) throw new Error(data.error ?? "Nomi could not process that request");
      if (input.audio) setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: data.transcript ?? "Voice note", kind: "voice" }]);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: data.spokenResponse, kind: "text" }]);
      setPlan(data.plan);
      setPlanToken(data.planToken);
      speak(data.spokenResponse);
      if (data.plan?.status === "COMPLETED" && data.plan.transactionHash) {
        const action = data.plan.actions[0];
        const entry: ActivityEntry = {
          id: data.plan.planId,
          amount: action.amount,
          recipient: action.recipient.kind === "contact" ? action.recipient.name : `${action.recipient.address.slice(0, 6)}…${action.recipient.address.slice(-4)}`,
          address: action.recipient.address,
          hash: data.plan.transactionHash,
          timestamp: data.plan.updatedAt,
          status: "Completed",
        };
        setActivities((current) => current.some((item) => item.hash === entry.hash) ? current : [entry, ...current]);
        await loadBalance();
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Nomi could not process that request";
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: message, kind: "status" }]);
      speak(message);
    } finally {
      setBusy(false);
    }
  }

  async function enableSigner() {
    if (!walletAddress) return;
    const signerId = process.env.NEXT_PUBLIC_PRIVY_KEY_QUORUM_ID;
    const policyId = process.env.NEXT_PUBLIC_PRIVY_TRANSFER_POLICY_ID;
    if (!signerId || !policyId) { setNotice("Nomi’s wallet permission is not configured."); return; }
    setEnabling(true);
    try {
      await addSigners({ address: walletAddress, signers: [{ signerId, policyIds: [policyId] }] });
      localStorage.setItem("nomi-signer-enabled", "yes");
      setSignerEnabled(true);
      setNotice("Voice-confirmed Testnet transfers are enabled.");
    } catch {
      setNotice("Nomi couldn’t enable wallet permission. You can try again safely.");
    } finally { setEnabling(false); }
  }

  async function revokeSigner() {
    if (!walletAddress) return;
    try {
      await removeSigners({ address: walletAddress });
      localStorage.removeItem("nomi-signer-enabled");
      setSignerEnabled(false);
      setNotice("Nomi’s wallet permission has been revoked.");
    } catch { setNotice("Nomi couldn’t revoke access. Try again before making another transaction."); }
  }

  async function pairShortcut() {
    if (!walletAddress) return;
    setPairing(true);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/shortcut/pair", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, contacts }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPairingToken(data.shortcutToken);
      setNotice("Shortcut pairing created. Copy the token into your Nomi Shortcut.");
    } catch {
      setNotice("Nomi couldn’t create a Shortcut pairing. Try again.");
    } finally {
      setPairing(false);
    }
  }

  if (!ready) return <div className="app-loading"><Image src="/nomi-mark.svg" alt="Nomi" width={52} height={52} /><span>Loading Nomi…</span></div>;
  if (!authenticated) return <Landing onLogin={login} />;
  if (!walletsReady || !wallet) return <div className="app-loading"><Image src="/nomi-mark.svg" alt="Nomi" width={52} height={52} /><span>Creating your integrated wallet…</span></div>;

  const tabs = [
    { id: "chat" as const, label: "Chat", icon: MessageCircle },
    { id: "activity" as const, label: "Activity", icon: Activity },
    { id: "contacts" as const, label: "Contacts", icon: BookUser },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setTab("chat"); }}><Image src="/nomi-mark.svg" alt="" width={38} height={38} /><span>Nomi</span></a>
        <nav aria-label="App navigation">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? "nav-item nav-item--active" : "nav-item"} type="button" onClick={() => setTab(id)}><Icon size={20} /><span>{label}</span></button>)}</nav>
        <div className="side-nav__foot"><span className="network-status"><i /> X Layer Testnet</span><button type="button" onClick={logout}>Sign out</button></div>
      </aside>

      <div className="app-content">
        {notice && <div className="notice" role="status">{notice}<button type="button" onClick={() => setNotice(null)}>Dismiss</button></div>}
        {tab === "chat" && <ChatWorkspace walletAddress={walletAddress} balanceLabel={`${Number(formatEther(balanceWei)).toLocaleString(undefined, { maximumFractionDigits: 6 })} OKB`} pendingPlan={plan} messages={messages} busy={busy} onSendText={(text) => sendTurn({ text })} onVoiceNote={(audio) => sendTurn({ audio })} />}
        {tab === "activity" && <ActivityPanel entries={activities} />}
        {tab === "contacts" && <ContactsPanel contacts={contacts} setContacts={setContacts} />}
        {tab === "settings" && <SettingsPanel walletAddress={walletAddress} signerEnabled={signerEnabled} enabling={enabling} onEnable={enableSigner} onRevoke={revokeSigner} onCreatePairing={pairShortcut} pairingToken={pairingToken} pairing={pairing} />}
      </div>

      <nav className="bottom-nav" aria-label="App navigation">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? "nav-item nav-item--active" : "nav-item"} type="button" onClick={() => setTab(id)}><Icon size={20} /><span>{label}</span></button>)}</nav>
    </div>
  );
}
