"use client";

import { getSession } from "next-auth/react";
import { useEffect } from "react";

// RSC auth() reads cannot write response cookies. This client request lets
// NextAuth renew the cookie while the protected app is visible/in use.
// It complements, never replaces, requireUser() on the server.
export function SessionRefresh() {
  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    const refresh = async () => {
      if (disposed || inFlight || document.visibilityState !== "visible")
        return;
      inFlight = true;
      try {
        const session = await getSession({ broadcast: false });
        if (!disposed && !session?.user?.id) window.location.replace("/login");
      } catch {
        if (!disposed) window.location.replace("/login");
      } finally {
        inFlight = false;
      }
    };
    const onFocus = () => {
      void refresh();
    };
    const timer = window.setInterval(onFocus, 5 * 60 * 1000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    void refresh();
    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);
  return null;
}
