import assert from "node:assert/strict";
import { test } from "node:test";
import {
  REMEMBERED_IDENTIFIER_KEY,
  readRememberedIdentifier,
  saveRememberedIdentifier,
} from "../../lib/auth/remembered-identifier";

function fixture() {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
  return { data, storage, getStorage: () => storage };
}

test("starts empty and remembers RCA as a string, including leading zeros", () => {
  const { data, getStorage } = fixture();
  assert.equal(readRememberedIdentifier(getStorage), "");
  saveRememberedIdentifier("00123", true, getStorage);
  assert.equal(readRememberedIdentifier(getStorage), "00123");
  assert.deepEqual([...data], [[REMEMBERED_IDENTIFIER_KEY, "00123"]]);
});

test("replaces the remembered RCA with an email, without storing credentials", () => {
  const { data, getStorage } = fixture();
  saveRememberedIdentifier("00123", true, getStorage);
  saveRememberedIdentifier("dev@academia.test", true, getStorage);
  assert.equal(readRememberedIdentifier(getStorage), "dev@academia.test");
  assert.deepEqual(
    [...data],
    [[REMEMBERED_IDENTIFIER_KEY, "dev@academia.test"]],
  );
});

test("opt-out removes only the remembered identifier", () => {
  const { data, getStorage } = fixture();
  data.set("academia-okajima-theme", "dark");
  saveRememberedIdentifier("00123", true, getStorage);
  saveRememberedIdentifier("00123", false, getStorage);
  assert.equal(readRememberedIdentifier(getStorage), "");
  assert.deepEqual([...data], [["academia-okajima-theme", "dark"]]);
});

test("empty or oversized values are not restored or retained", () => {
  const { data, getStorage } = fixture();
  for (const value of ["", "   ", "a".repeat(256)]) {
    data.set(REMEMBERED_IDENTIFIER_KEY, value);
    assert.equal(readRememberedIdentifier(getStorage), "");
    saveRememberedIdentifier(value, true, getStorage);
    assert.equal(data.has(REMEMBERED_IDENTIFIER_KEY), false);
  }
  saveRememberedIdentifier("a".repeat(255), true, getStorage);
  assert.equal(readRememberedIdentifier(getStorage).length, 255);
});

test("unavailable storage does not throw during reads, writes or removal", () => {
  const blocked = () => {
    throw new Error("Storage blocked");
  };
  const throwingMethods = () => ({
    getItem: blocked,
    setItem: blocked,
    removeItem: blocked,
  });
  for (const getStorage of [blocked, throwingMethods]) {
    assert.equal(readRememberedIdentifier(getStorage), "");
    assert.doesNotThrow(() =>
      saveRememberedIdentifier("00123", true, getStorage),
    );
    assert.doesNotThrow(() =>
      saveRememberedIdentifier("00123", false, getStorage),
    );
  }
});
