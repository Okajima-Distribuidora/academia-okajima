"use client";

import { useState, useSyncExternalStore } from "react";
import { readRememberedIdentifier, REMEMBERED_IDENTIFIER_KEY, saveRememberedIdentifier } from "@/lib/auth/remembered-identifier";

const CHANGE_EVENT = "academia-okajima:remembered-identifier-change";
const serverSnapshot = () => "";

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === REMEMBERED_IDENTIFIER_KEY || event.key === null) onChange();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useRememberedIdentifier() {
  const savedIdentifier = useSyncExternalStore(subscribe, readRememberedIdentifier, serverSnapshot);
  const [draft, setDraft] = useState<string | null>(null);
  const [rememberChoice, setRememberChoice] = useState<boolean | null>(null);
  const identifier = draft ?? savedIdentifier;
  const remember = rememberChoice ?? Boolean(savedIdentifier);

  function persist(value: string, enabled: boolean) {
    saveRememberedIdentifier(value, enabled);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  function changeIdentifier(value: string) {
    setDraft(value);
    // Keep the user's opt-in while editing or temporarily clearing the field.
    setRememberChoice(remember);
    if (remember) persist(value, true);
  }

  function changeRemember(checked: boolean) {
    // Forget storage without erasing what is currently typed in the form.
    setDraft(identifier);
    setRememberChoice(checked);
    persist(identifier, checked);
  }

  return { identifier, remember, changeIdentifier, changeRemember,
    persistIdentifier: (value: string) => persist(value, remember) };
}
