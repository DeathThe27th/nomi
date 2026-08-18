import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createTransferPlan } from "@/lib/domain/conversation";
import { ChatWorkspace } from "../chat-workspace";

const plan = createTransferPlan({
  amount: "0.02",
  recipient: {
    kind: "contact",
    name: "Alex",
    address: "0x1111111111111111111111111111111111111111",
  },
  now: new Date("2026-08-18T00:00:00.000Z"),
});

describe("Nomi chat workspace", () => {
  it("greets a new user with Nomi's approved greeting", () => {
    render(
      <ChatWorkspace
        walletAddress="0x2222222222222222222222222222222222222222"
        balanceLabel="0 OKB"
        pendingPlan={null}
        messages={[]}
        onSendText={vi.fn()}
        onVoiceNote={vi.fn()}
      />,
    );
    expect(screen.getByText("Hi, I’m Nomi, how can I assist you today?")).toBeInTheDocument();
  });

  it("shows the exact recipient and amount in a pending plan", () => {
    render(
      <ChatWorkspace
        walletAddress="0x2222222222222222222222222222222222222222"
        balanceLabel="1.25 OKB"
        pendingPlan={plan}
        messages={[]}
        onSendText={vi.fn()}
        onVoiceNote={vi.fn()}
      />,
    );
    expect(screen.getByText("0.02 OKB")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("0x1111…1111")).toBeInTheDocument();
    expect(screen.getByText("Awaiting confirmation")).toBeInTheDocument();
  });
});
