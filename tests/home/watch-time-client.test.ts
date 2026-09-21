import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { createVideoWatchTracker } from "../../lib/home/watch-time-client";

test("player tracker: cumulative retry, close, hidden tab and resume after beacon", async () => {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  function globalValue(name: string, value: unknown) {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }
  let clock = 0;
  let interval: (() => void) | undefined;
  let fail = true;
  const sent: Array<{
    action: string;
    sessionId: string;
    sequence?: number;
    buckets?: Record<string, number>;
    close?: boolean;
  }> = [];
  const document = { visibilityState: "visible" };
  const now = mock.method(performance, "now", () => clock);
  globalValue("document", document);
  globalValue("window", {
    setInterval: (callback: () => void) => {
      interval = callback;
      return 1;
    },
    clearInterval: () => undefined,
  });
  globalValue("navigator", { sendBeacon: () => true });
  globalValue("fetch", async (_url: string, options: { body: string }) => {
    const payload = JSON.parse(options.body);
    sent.push(payload);
    if (payload.action === "start")
      return Response.json({
        id: payload.sessionId,
        serverNow: Date.parse("2026-09-21T12:00:00Z") + clock,
      });
    if (fail) {
      fail = false;
      throw new Error("Offline");
    }
    return Response.json({ accepted: true });
  });
  const settle = () => new Promise<void>((resolve) => setImmediate(resolve));
  const tracker = createVideoWatchTracker(10);
  try {
    tracker.playing(true);
    await settle();
    tracker.sample(0);
    clock += 1000;
    tracker.sample(1);
    interval?.();
    await settle(); // Uncertain network failure.
    clock += 1000;
    tracker.sample(2);
    interval?.();
    await settle();
    const checkpoints = sent.filter((item) => item.action === "checkpoint");
    assert.equal(Object.values(checkpoints[0].buckets ?? {})[0], 1000);
    assert.equal(Object.values(checkpoints[1].buckets ?? {})[0], 2000);
    assert.equal(checkpoints[0].sessionId, checkpoints[1].sessionId);
    tracker.playing(false, true);
    await settle();
    const final = sent.at(-1);
    assert.equal(final?.close, true);
    clock += 10000;
    tracker.sample(200);
    assert.equal(sent.at(-1), final);
    tracker.playing(true);
    await settle();
    assert.equal(sent.filter((item) => item.action === "start").length, 2);
    document.visibilityState = "hidden";
    tracker.hide();
    document.visibilityState = "visible";
    tracker.playing(true);
    await settle();
    assert.equal(sent.filter((item) => item.action === "start").length, 3);
  } finally {
    tracker.dispose();
    now.mock.restore();
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
