/**
 * Shared "does the user have a usable credential for this provider" probe.
 *
 * Used anywhere the console needs to know which providers are actually
 * callable — the `/model` picker (only list authenticated providers) and the
 * banner's Session panel (don't display an unauthenticated model as if it were
 * ready to use) both need the exact same answer, so it lives here once.
 */
import { useEffect, useState } from "indusagi/react-host";
import { hasValidServerToken } from "../boot/server-token.js";
import { serverTierProviders } from "../boot/runners/server-mode.js";
import type { OverlayServices } from "./contract.js";

/**
 * Load the set of provider ids the user has USABLE credentials for, live.
 *
 * Two independent sources count: (1) any saved account in the local vault for a
 * provider `listLoginProviders()` names, and (2) a valid server session token,
 * which makes every gateway-eligible provider usable even though the server
 * tier never writes into the vault. Returns `null` until the probe settles.
 */
export function useAuthenticatedProviders(services: OverlayServices | undefined, refreshKey?: unknown): Set<string> | null {
  const [authed, setAuthed] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (!services) return;
    let live = true;
    void (async () => {
      const found = new Set<string>();
      try {
        for (const provider of services.listLoginProviders()) {
          try {
            if ((await services.vault.listAccounts(provider.id)).length > 0) {
              found.add(provider.id);
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
      try {
        if (await hasValidServerToken()) {
          for (const provider of serverTierProviders()) found.add(provider);
        }
      } catch {
        // ignore
      }
      if (live) setAuthed(found);
    })();
    return () => {
      live = false;
    };
  }, [refreshKey]);
  return authed;
}