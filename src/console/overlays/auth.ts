/**
 * Auth overlays — the sign-in / sign-out and plugin dialogs.
 */
import React, { useEffect, useState } from "indusagi/react-host";
import { Box, Text, useInput } from "indusagi/react-host/ink";
import { DialogFrame, LoginDialog, OAuthDialog } from "indusagi/react-ink";
import { jsx } from "indusagi/react-host/jsx-runtime";
import { clearServerToken, getServerToken } from "../../boot/server-token.js";
import { isGatewayEligibleProvider } from "../../boot/runners/server-mode.js";
import type { OverlayGroupProps } from "./pickers.js";

const { useRef } = React;

function SignInDialog(props: OverlayGroupProps & { requestedProvider?: string }) {
  const { services, dispatch, closeModal, requestedProvider } = props;
  const providers = (() => {
    try {
      return services!.listLoginProviders().map((entry: any) => ({
        id: entry.id,
        label: entry.label,
        authKind: entry.authKind
      }));
    } catch {
      return [];
    }
  })();
  const direct = requestedProvider !== void 0 ? providers.find((p) => p.id === requestedProvider) : void 0;
  useEffect(() => {
    if (direct === void 0) return;
    dispatch({
      type: "modal:open",
      kind: "oauth",
      payload: {
        providerId: direct.id,
        mode: direct.authKind === "oauth" ? "oauth" : "apiKey"
      }
    });
  }, []);
  if (direct !== void 0) return null;
  return jsx(LoginDialog, {
    mode: "login",
    providers,
    onClose: closeModal,
    onSelect: (provider: any) => {
      dispatch({
        type: "modal:open",
        kind: "oauth",
        payload: {
          providerId: provider.id,
          mode: provider.authKind === "oauth" ? "oauth" : "apiKey"
        }
      });
    }
  });
}

const SERVER_TIER_ACCOUNT_ID = "server-session";
const SERVER_TIER_PROVIDER_ID = "indus-server";

function SignOutDialog(props: OverlayGroupProps) {
  const { services, closeModal, dispatch } = props;
  const [accounts, setAccounts] = useState<any[]>([]);
  useEffect(() => {
    let live = true;
    void (async () => {
      const rows: any[] = [];
      try {
        const token = await getServerToken();
        if (token) {
          rows.push({
            provider: SERVER_TIER_PROVIDER_ID,
            accountId: SERVER_TIER_ACCOUNT_ID,
            label: "Indus Server · signed in"
          });
        }
      } catch {
        // ignore
      }
      try {
        for (const provider of services!.listLoginProviders()) {
          let names: string[] = [];
          try {
            names = await services!.vault.listAccounts(provider.id);
          } catch {
            names = [];
          }
          for (const accountId of names) {
            rows.push({
              provider: provider.id,
              accountId,
              label: `${provider.label} · ${accountId}`
            });
          }
        }
      } catch {
        // ignore
      }
      if (live) setAccounts(rows);
    })();
    return () => {
      live = false;
    };
  }, []);
  return jsx(LoginDialog, {
    mode: "logout",
    accounts,
    onClose: closeModal,
    onSelect: async (account: any) => {
      try {
        if (account.provider === SERVER_TIER_PROVIDER_ID) {
          await clearServerToken();
        } else {
          await services!.vault.remove(account.provider, account.accountId);
        }
        await services!.refreshGatewayRouting();
        dispatch({type:"status:set",status:{kind:"info",text:"Signed out. Model routing refreshed."}});
      } catch (error) {
        dispatch({type:"status:set",status:{kind:"error",text:error instanceof Error ? error.message : "Sign-out failed."}});
      }
      closeModal();
    }
  });
}

function seedOAuthState(providerId: string, providerName: string, mode: string) {
  return {
    kind: "oauth",
    providerId,
    providerName,
    mode,
    inputLabel: mode === "apiKey" ? `${providerName} API key` : "Authorization code or redirect URL",
    inputValue: "",
    accountId: "default",
    accountName: "Default"
  };
}

function selectProviderModel(services: any, providerId: string) {
  try {
    const cards = services.conductor.availableModels().filter((c: any) => c.provider === providerId);
    const chosen = cards[cards.length - 1];
    if (chosen) services.conductor.selectModel(chosen.id);
  } catch {
    // ignore
  }
}

function OAuthFlowDialog(props: OverlayGroupProps & { providerId: string; mode: "oauth" | "apiKey" }) {
  const { services, providerId, mode, dispatch, closeModal } = props;
  const providerName = (() => {
    try {
      const match = services!.listLoginProviders().find((p: any) => p.id === providerId);
      return match?.label ?? providerId;
    } catch {
      return providerId;
    }
  })();
  const [state, setState] = useState(() => seedOAuthState(providerId, providerName, mode));
  const pending = useRef<((value: string) => void) | null>(null);
  const cancelPrompt = useRef<(() => void) | null>(null);
  const mounted = useRef(true);
  const saving = useRef(false);
  useEffect(() => () => { mounted.current = false; }, []);
  const merge = (next: any) => setState((prev) => ({ ...prev, ...next }));
  useEffect(() => {
    if (mode !== "oauth") return;
    let live = true;
    const controller = new AbortController();
    const safeMerge = (next: any) => {
      if (live) merge(next);
    };
    const callbacks = {
      signal: controller.signal,
      onAuth: (info: any) => {
        if (!live) return;
        safeMerge({ authInfo: info, progress: "Opening your browser to sign in…" });
        void services!.openLoginUrl(info.url).then((opened: boolean) => {
          safeMerge({
            progress: opened
              ? "Opened the login URL in your browser. Finish there, then paste the code if prompted."
              : "Could not open a browser automatically — open the URL above, then paste the code if prompted."
          });
        });
      },
      onPrompt: (prompt: any) =>
        new Promise<string>((resolve, reject) => {
          if (!live) { reject(new DOMException("Sign-in cancelled", "AbortError")); return; }
          cancelPrompt.current = () => reject(new DOMException("Sign-in cancelled", "AbortError"));
          pending.current = value => { cancelPrompt.current = null; resolve(value); };
          safeMerge({ prompt, inputLabel: prompt.message, inputValue: "" });
        }),
      onManualCodeInput: () =>
        new Promise<string>((resolve, reject) => {
          if (!live) { reject(new DOMException("Sign-in cancelled", "AbortError")); return; }
          cancelPrompt.current = () => reject(new DOMException("Sign-in cancelled", "AbortError"));
          pending.current = value => { cancelPrompt.current = null; resolve(value); };
          safeMerge({
            prompt: { message: "Paste the authorization code or complete redirect URL:" },
            inputLabel: "Authorization code or redirect URL",
            inputValue: ""
          });
        }),
      onProgress: (message: string) => {
        safeMerge({ progress: message });
      }
    };
    void (async () => {
      try {
        await services!.startOAuthLogin(providerId, callbacks, services!.vault);
        if (!live) return;
        await services!.refreshGatewayRouting();
        if (!live) return;
        selectProviderModel(services!, providerId);
        if (live) {
          dispatch({
            type: "status:set",
            status: { kind: "success", text: `Signed in to ${providerName}.` }
          });
          closeModal();
        }
      } catch {
        safeMerge({ progress: "Sign-in did not complete." });
      }
    })();
    return () => {
      live = false;
      controller.abort(); cancelPrompt.current?.(); cancelPrompt.current = null; pending.current = null;
    };
  }, []);
  const saveApiKey = () => {
    const key = (state as any).inputValue.trim();
    if (key.length === 0 || saving.current) return;
    saving.current = true;
    const account = (state as any).accountId ?? "default";
    void (async () => {
      try {
        await services!.vault.putApiKey(providerId, account, key, true);
        if (!mounted.current) return;
        await services!.refreshGatewayRouting();
        if (!mounted.current) return;
        selectProviderModel(services!, providerId);
        dispatch({
          type: "status:set",
          status: { kind: "success", text: `Saved your ${providerName} API key.` }
        });
      } catch {
        dispatch({
          type: "status:set",
          status: { kind: "error", text: `Could not save the ${providerName} API key.` }
        });
      }
      closeModal();
    })();
  };
  return jsx(OAuthDialog, {
    state,
    onChange: (next: any) => merge(next),
    onSubmit: () => {
      if (mode === "apiKey") {
        saveApiKey();
        return;
      }
      const resolve = pending.current;
      if (resolve === null) return;
      pending.current = null;
      const value = (state as any).inputValue;
      merge({ inputValue: "", prompt: void 0 });
      resolve(value);
    },
    onClose: closeModal
  });
}

function readPluginRequest(payload: unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as any;
    return {
      surface: typeof record.surface === "string" ? record.surface : "plugin",
      ...(typeof record.title === "string" ? { title: record.title } : {}),
      ...(typeof record.text === "string" ? { text: record.text } : {})
    };
  }
  return { surface: "plugin" };
}

function PluginDialog(props: { request: ReturnType<typeof readPluginRequest>; closeModal: () => void }) {
  const { request, closeModal } = props;
  const body = request.text ?? `No data available for the ${request.surface} surface.`;
  const lines = body.split("\n");
  useInput((input, key) => {
    if (key.escape || key.return || input === "q" || input === "x") {
      closeModal?.();
    }
  });
  return jsx(DialogFrame, {
    title: request.title ?? "Plugin surface",
    subtitle: request.surface,
    footer: jsx(Text, { children: "esc / enter to close" }),
    children: jsx(Box, {
      flexDirection: "column",
      children: lines.map((line, index) => jsx(Text, { children: line.length === 0 ? " " : line }, index))
    })
  });
}

function readRequestedProvider(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "providerId" in (payload as any)) {
    const id = (payload as any).providerId;
    if (typeof id === "string" && id.length > 0) return id;
  }
  return void 0;
}

function readProviderId(payload: unknown): string {
  if (payload && typeof payload === "object" && "providerId" in (payload as any)) {
    const id = (payload as any).providerId;
    if (typeof id === "string") return id;
  }
  return "";
}

function readEntryMode(payload: unknown): "apiKey" | "oauth" {
  if (payload && typeof payload === "object" && "mode" in (payload as any)) {
    const mode = (payload as any).mode;
    if (mode === "apiKey") return "apiKey";
  }
  return "oauth";
}

export function AuthOverlays(props: OverlayGroupProps) {
  const { modal, services, dispatch, closeModal } = props;
  if (modal.kind === "plugin") {
    return jsx(PluginDialog, { request: readPluginRequest(modal.payload), closeModal });
  }
  if (services === void 0) return null;
  switch (modal.kind) {
    case "signIn":
      return jsx(SignInDialog, {
        ...props,
        services,
        dispatch,
        closeModal,
        requestedProvider: readRequestedProvider(modal.payload)
      });
    case "signOut":
      return jsx(SignOutDialog, { ...props, services, closeModal });
    case "oauth": {
      const providerId = readProviderId(modal.payload);
      const mode = readEntryMode(modal.payload);
      return jsx(OAuthFlowDialog, {
        ...props,
        services,
        providerId,
        mode,
        dispatch,
        closeModal
      });
    }
    default:
      return null;
  }
}