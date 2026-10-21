import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { AppConfig } from "../interfaces";
import api from "./api";
import { isDemoMode } from "./config";
import { getToken } from "./session";

let configPromise: Promise<AppConfig> | null = null;
const FALLBACK: AppConfig = { payments: "mock", currency: "cad", uploads: false, demoAccounts: false, browserDemo: isDemoMode() };

/** Server capabilities (payment mode, demo logins), fetched once per page load. */
export function useAppConfig(): AppConfig {
  const [config, setConfig] = useState<AppConfig>(FALLBACK);
  useEffect(() => {
    configPromise ??= api.config().catch(() => FALLBACK);
    let alive = true;
    configPromise.then((c) => alive && setConfig(c));
    return () => {
      alive = false;
    };
  }, []);
  return config;
}

/** Generic async loader with reload; keeps the last good data on refresh. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fnRef
      .current()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, error, loading, reload: () => setTick((t) => t + 1), setData };
}

// Loaded on first use, so pages without live totals don't ship the client.
let socket: Promise<Socket> | null = null;
function getSocket() {
  socket ??= import("socket.io-client").then(({ io }) => {
    const url = (import.meta.env.VITE_SOCKET_URL as string | undefined) || undefined;
    return io(url ?? window.location.origin, { transports: ["websocket"], auth: { token: getToken() } });
  });
  return socket;
}

/**
 * Calls `onDonation` whenever someone gives to this campaign: through
 * Socket.IO against the API, or a window event in the browser-only demo.
 */
export function useCampaignLive(campaignId: string | undefined, onDonation: () => void) {
  const cb = useRef(onDonation);
  cb.current = onDonation;
  useEffect(() => {
    if (!campaignId) return;
    if (isDemoMode()) {
      const handler = (e: Event) => {
        if ((e as CustomEvent).detail?.campaignId === campaignId) cb.current();
      };
      window.addEventListener("cf:donation", handler);
      return () => window.removeEventListener("cf:donation", handler);
    }
    let alive = true;
    let stop = () => {};
    getSocket().then((s) => {
      if (!alive) return;
      const join = () => s.emit("join-campaign", campaignId);
      const handler = (data: { campaignId: string }) => {
        if (String(data?.campaignId) === campaignId) cb.current();
      };
      join();
      s.on("connect", join);
      s.on("campaign-updated", handler);
      stop = () => {
        s.emit("leave-campaign", campaignId);
        s.off("connect", join);
        s.off("campaign-updated", handler);
      };
    });
    return () => {
      alive = false;
      stop();
    };
  }, [campaignId]);
}
