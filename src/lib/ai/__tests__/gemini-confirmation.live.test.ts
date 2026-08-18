import { describe, expect, it } from "vitest";
import { understandTextTurn } from "../gemini";

const live = process.env.RUN_LIVE_AI === "1" ? describe : describe.skip;
const context = {
  hasPendingPlan: true,
  supportedContacts: ["Alex"],
  pendingPlanSummary: "0.02 OKB to Alex at 0x1111111111111111111111111111111111111111",
};

live("Gemini live confirmation language", () => {
  it("treats yes with a change as a modification, never approval", async () => {
    const turn = await understandTextTurn({ text: "Yes, but make it 0.05 OKB.", context });
    expect(turn.turnType).toBe("modify_plan");
    expect(turn.intent).toMatchObject({ amount: "0.05" });
  }, 30_000);

  it("recognizes plain confirmation of the unchanged plan", async () => {
    const turn = await understandTextTurn({ text: "Yes, do it.", context });
    expect(turn.turnType).toBe("confirm");
  }, 30_000);

  it("recognizes cancellation", async () => {
    const turn = await understandTextTurn({ text: "No, cancel that.", context });
    expect(turn.turnType).toBe("cancel");
  }, 30_000);
});
