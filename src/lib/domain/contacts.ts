import { getAddress, isAddress } from "viem";

export type Contact = {
  id: string;
  name: string;
  address: `0x${string}`;
  createdAt: string;
  updatedAt: string;
};

export type ContactInput = {
  name: string;
  address: string;
};

function normalizeName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error("Enter a contact name");
  if (normalized.length > 40) throw new Error("Contact names must be 40 characters or fewer");
  return normalized;
}

function normalizeAddress(address: string): `0x${string}` {
  if (!isAddress(address, { strict: false })) {
    throw new Error("Enter a valid EVM wallet address");
  }
  return getAddress(address);
}

export function resolveContact(contacts: Contact[], reference: string): Contact | null {
  const normalized = normalizeName(reference).toLocaleLowerCase();
  return contacts.find((contact) => contact.name.toLocaleLowerCase() === normalized) ?? null;
}

export function addContact(
  contacts: Contact[],
  input: ContactInput,
  now = new Date(),
): Contact[] {
  const name = normalizeName(input.name);
  const duplicate = resolveContact(contacts, name);
  if (duplicate) throw new Error(`A contact named ${duplicate.name} already exists`);

  const address = normalizeAddress(input.address);
  const timestamp = now.toISOString();
  const contact: Contact = {
    id: crypto.randomUUID(),
    name,
    address,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return [...contacts, contact];
}

export function updateContact(
  contacts: Contact[],
  contactId: string,
  input: Partial<ContactInput>,
  addressChangeConfirmed = false,
  now = new Date(),
): Contact[] {
  const existing = contacts.find((contact) => contact.id === contactId);
  if (!existing) throw new Error("Contact not found");

  const name = input.name === undefined ? existing.name : normalizeName(input.name);
  const collision = contacts.find(
    (contact) => contact.id !== contactId && contact.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
  );
  if (collision) throw new Error(`A contact named ${collision.name} already exists`);

  const address = input.address === undefined ? existing.address : normalizeAddress(input.address);
  if (address !== existing.address && !addressChangeConfirmed) {
    throw new Error("Confirm this address change");
  }

  return contacts.map((contact) =>
    contact.id === contactId
      ? { ...contact, name, address, updatedAt: now.toISOString() }
      : contact,
  );
}

export function deleteContact(contacts: Contact[], contactId: string): Contact[] {
  return contacts.filter((contact) => contact.id !== contactId);
}
