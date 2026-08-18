import { describe, expect, it } from "vitest";
import {
  addContact,
  resolveContact,
  updateContact,
  type Contact,
} from "../contacts";

const alex: Contact = {
  id: "contact-alex",
  name: "Alex",
  address: "0x1111111111111111111111111111111111111111",
  createdAt: "2026-08-18T00:00:00.000Z",
  updatedAt: "2026-08-18T00:00:00.000Z",
};

describe("address book", () => {
  it("resolves a saved name without changing its wallet address", () => {
    const result = resolveContact([alex], "alex");
    expect(result).toEqual(alex);
  });

  it("rejects duplicate names regardless of capitalization", () => {
    expect(() =>
      addContact([alex], {
        name: "  ALEX ",
        address: "0x2222222222222222222222222222222222222222",
      }),
    ).toThrow("A contact named Alex already exists");
  });

  it("rejects malformed wallet addresses", () => {
    expect(() => addContact([], { name: "Sam", address: "not-an-address" })).toThrow(
      "Enter a valid EVM wallet address",
    );
  });

  it("requires explicit address-change acknowledgement", () => {
    expect(() =>
      updateContact([alex], alex.id, {
        address: "0x2222222222222222222222222222222222222222",
      }),
    ).toThrow("Confirm this address change");

    const result = updateContact(
      [alex],
      alex.id,
      { address: "0x2222222222222222222222222222222222222222" },
      true,
    );
    expect(result[0].address).toBe("0x2222222222222222222222222222222222222222");
  });
});
