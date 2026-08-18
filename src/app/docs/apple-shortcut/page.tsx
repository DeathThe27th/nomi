import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Apple Shortcut setup — Nomi",
  description: "Connect Nomi to the iPhone Action Button.",
};

export default function AppleShortcutGuide() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const endpoint = appUrl ? `${appUrl.replace(/\/$/, "")}/api/voice/turn` : "Your deployed Nomi URL followed by /api/voice/turn";

  return (
    <main className="docs-page">
      <header className="docs-header"><Link className="brand" href="/"><Image src="/nomi-mark.svg" alt="" width={36} height={36} /> Nomi</Link><Link href="/">Back to Nomi</Link></header>
      <article className="docs-article">
        <h1>Use Nomi from your iPhone Action Button</h1>
        <p className="docs-lead">This Shortcut records raw audio, sends it to your paired Nomi account, speaks the response, and continues only when Nomi needs another answer.</p>

        <section><h2>Before you begin</h2><ol><li>Sign in to Nomi.</li><li>Open <strong>Settings → Voice authorization</strong> and enable Nomi access.</li><li>Under <strong>iPhone Action Button</strong>, create a pairing and copy the Shortcut token.</li><li>Keep the token private. It expires after seven days, and revoking Nomi access prevents transactions.</li></ol></section>

        <section><h2>Create the Shortcut</h2><ol>
          <li>Open Apple’s <strong>Shortcuts</strong> app and tap <strong>+</strong>.</li>
          <li>Name the Shortcut <strong>Nomi</strong>.</li>
          <li>Add a <strong>Text</strong> action and paste your Nomi Shortcut token. Set it as a variable named <strong>Shortcut Token</strong>.</li>
          <li>Add another <strong>Text</strong> action with this exact Voice API URL:<code className="docs-code">{endpoint}</code></li>
          <li>Add <strong>Speak Text</strong>: “Hi, I’m Nomi, how can I assist you today?”</li>
          <li>Add <strong>Repeat</strong> and set it to five times. This prevents an accidental endless conversation.</li>
          <li>Inside Repeat, add <strong>Record Audio</strong>. Start immediately and finish after ten seconds. You can change this duration later.</li>
          <li>Add <strong>Get Contents of URL</strong>. Choose the Voice API URL, method <strong>POST</strong>, and request body <strong>Form</strong>.</li>
          <li>Add form field <strong>audio</strong> with the Recorded Audio file.</li>
          <li>Add form field <strong>shortcutToken</strong> with the Shortcut Token variable.</li>
          <li>If a <strong>Plan Token</strong> variable exists, add form field <strong>planToken</strong> with that variable. It keeps the exact pending transaction between turns.</li>
          <li>From the returned dictionary, get <strong>spokenResponse</strong> and add <strong>Speak Text</strong> using that value.</li>
          <li>Get <strong>planToken</strong> from the response and set the <strong>Plan Token</strong> variable.</li>
          <li>Get <strong>requiresUserResponse</strong>. If it is false, add <strong>Stop This Shortcut</strong>. Otherwise, Repeat records the next answer.</li>
        </ol></section>

        <section><h2>Assign the Action Button</h2><ol><li>Open iPhone <strong>Settings → Action Button</strong>.</li><li>Choose <strong>Shortcut</strong>.</li><li>Select <strong>Nomi</strong>.</li><li>Press the Action Button and test with “What is my OKB balance?” before trying a transfer.</li></ol></section>

        <section className="docs-warning"><h2>Important safety behavior</h2><ul><li>“Yes” approves only the exact unchanged plan Nomi just explained.</li><li>A changed amount or recipient always creates a new plan and asks again.</li><li>Nomi is limited to X Layer Testnet native OKB transfers up to 0.05 OKB.</li><li>If the phone or token is lost, open Nomi Settings and revoke Nomi access.</li></ul></section>
      </article>
    </main>
  );
}
