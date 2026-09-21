import {
  addWatchInterval,
  measuredPlaybackMs,
  type WatchBuckets,
} from "./watch-time-rules";

const endpoint = "/api/home/watch-time";

export function createVideoWatchTracker(videoId: number) {
  type Session = {
    id: string;
    buckets: WatchBuckets;
    sequence: number;
    serverNow: number;
    clock: number;
    closing: boolean;
  };
  let session: Session | null = null;
  let starting = false;
  let startId = crypto.randomUUID();
  let retryAt = 0;
  let active = false;
  let disposed = false;
  let rate = 1;
  let last: { clock: number; seconds: number } | null = null;

  async function start() {
    if (
      starting ||
      session ||
      disposed ||
      !active ||
      performance.now() < retryAt
    )
      return;
    starting = true;
    retryAt = performance.now() + 30_000;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "start", sessionId: startId, videoId }),
      });
      if (!response.ok) {
        if (response.status === 410) startId = crypto.randomUUID();
        return;
      }
      const result = (await response.json()) as {
        id: string;
        serverNow: number;
      };
      session = {
        id: result.id,
        buckets: {},
        sequence: 0,
        serverNow: result.serverNow,
        clock: performance.now(),
        closing: false,
      };
      last = null;
      if (disposed || !active) void flush(true, disposed);
    } catch {
      /* Same startId retries an uncertain start without creating another session. */
    } finally {
      starting = false;
    }
  }

  async function flush(close = false, beacon = false) {
    const current = session;
    if (!current || current.closing) return;
    current.closing = close;
    const body = JSON.stringify({
      action: "checkpoint",
      sessionId: current.id,
      sequence: ++current.sequence,
      buckets: { ...current.buckets },
      close,
    });
    if (
      beacon &&
      navigator.sendBeacon?.(
        endpoint,
        new Blob([body], { type: "application/json" }),
      )
    ) {
      session = null;
      startId = crypto.randomUUID();
      retryAt = 0;
      return;
    }
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: beacon,
      });
      if (session !== current) return;
      if (
        (response.ok && close) ||
        response.status === 410 ||
        response.status === 404 ||
        response.status === 403
      ) {
        session = null;
        startId = crypto.randomUUID();
        retryAt = response.ok ? 0 : performance.now() + 30_000;
        last = null;
      }
    } catch {
      /* Next cumulative checkpoint retries everything not yet acknowledged. */
    } finally {
      current.closing = false;
    }
  }

  const interval = window.setInterval(() => {
    void flush(!active);
  }, 30_000);
  return {
    playing(value: boolean, close = false) {
      active = value && document.visibilityState !== "hidden";
      last = null;
      if (active) void start();
      else void flush(close);
    },
    rate(value: number) {
      rate = value;
      last = null;
    },
    sample(seconds: number) {
      const clock = performance.now();
      if (!active || disposed || document.visibilityState === "hidden") {
        last = null;
        return;
      }
      if (!session) {
        void start();
        last = null;
        return;
      }
      if (session.closing) {
        last = null;
        return;
      }
      if (last) {
        const ms = measuredPlaybackMs(
          clock - last.clock,
          seconds - last.seconds,
          rate,
        );
        const end = session.serverNow + clock - session.clock;
        if (ms > 0) addWatchInterval(session.buckets, end - ms, end);
      }
      last = { clock, seconds };
    },
    hide() {
      active = false;
      last = null;
      void flush(true, true);
    },
    dispose() {
      disposed = true;
      active = false;
      last = null;
      window.clearInterval(interval);
      void flush(true, true);
    },
  };
}
