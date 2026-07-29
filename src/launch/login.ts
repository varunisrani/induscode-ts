/**
 * Login command — `runLogin`.
 *
 * The top-level `login` / `logout` / `whoami` surface that authenticates the CLI
 * against the indus-server so a user with **no local provider key** can still run
 * model turns through the server gateway.
 */
import { createInterface } from "node:readline/promises";
import chalk from "chalk";
import type { OAuthLoginCallbacks } from "indusagi/ai";
import type { BootContext } from "../boot/contract.js";
import {
  TOKEN_FILE,
  clearServerToken,
  getServerToken,
  INDUS_SERVER_URL,
  isServerTokenExpired,
  storeServerToken,
} from "../boot/server-token.js";

export const SERVER_TIER_PROVIDER_ID = "indus-server";

const INDUS_CLIENT_ID = process.env.INDUS_CLIENT_ID ?? "indus-cli";
const USER_AGENT = "indus CLI";
const DEVICE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";
const DEVICE_SCOPE = "openid profile email";
const EXIT_OK = 0;
const EXIT_FAILURE = 1;

class LoginError extends Error {}

function out(line: string = ""): void {
  process.stdout.write(`${line}\n`);
}

function err(line: string): void {
  process.stderr.write(`${line}\n`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface DeviceCodeResponse {
  device_code?: string;
  user_code?: string;
  verification_uri?: string;
  verification_uri_complete?: string;
  expires_in?: number;
  interval?: number;
  error?: string;
  error_description?: string;
  message?: string;
}

async function postJson(
  url: string,
  body: Record<string, unknown>,
): Promise<{ status: number; data: DeviceCodeResponse }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent": USER_AGENT,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as DeviceCodeResponse;
  return { status: res.status, data };
}

interface LoginArgs {
  serverUrl: string;
  clientId: string;
}

function parseLoginArgs(tail: string[]): LoginArgs {
  let serverUrl = INDUS_SERVER_URL;
  let clientId = INDUS_CLIENT_ID;
  for (let i = 0; i < tail.length; i++) {
    const token = tail[i];
    const eq = token.indexOf("=");
    const name = eq >= 0 ? token.slice(0, eq) : token;
    const inline = eq >= 0 ? token.slice(eq + 1) : undefined;
    const take = (): string | undefined =>
      inline !== undefined ? inline : tail[++i];
    if (name === "--server-url") {
      const value = take();
      if (value) serverUrl = value;
    } else if (name === "--client-id") {
      const value = take();
      if (value) clientId = value;
    }
  }
  return { serverUrl: serverUrl.replace(/\/+$/, ""), clientId };
}

async function confirm(prompt: string, defaultValue: boolean): Promise<boolean> {
  if (!process.stdin.isTTY) return defaultValue;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const hint = defaultValue ? "Y/n" : "y/N";
    const answer = (await rl.question(`${prompt} [${hint}] `)).trim().toLowerCase();
    if (answer === "") return defaultValue;
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}

async function requestDeviceCode(
  serverUrl: string,
  clientId: string,
): Promise<DeviceCodeResponse> {
  const { status, data } = await postJson(`${serverUrl}/api/auth/device/code`, {
    client_id: clientId,
    scope: DEVICE_SCOPE,
  });
  if (status >= 400 || typeof data.device_code !== "string") {
    throw new LoginError(
      `Authorization request failed: ${data.error_description ?? data.error ?? data.message ?? `HTTP ${status}`}`,
    );
  }
  return data;
}

async function pollForToken(
  serverUrl: string,
  clientId: string,
  device: DeviceCodeResponse,
): Promise<DeviceCodeResponse> {
  let intervalMs = Math.max(1, device.interval ?? 5) * 1000;
  const deadline = Date.now() + (device.expires_in ?? 0) * 1000;
  while (Date.now() < deadline) {
    await sleep(intervalMs);
    const { data } = await postJson(`${serverUrl}/api/auth/device/token`, {
      grant_type: DEVICE_GRANT_TYPE,
      device_code: device.device_code,
      client_id: clientId,
    });
    if (typeof data.access_token === "string") {
      return data;
    }
    const code = data.error;
    switch (code) {
      case "authorization_pending":
      case undefined:
        break;
      case "slow_down":
        intervalMs += 5000;
        break;
      case "access_denied":
        throw new LoginError("Authorization was denied.");
      case "expired_token":
        throw new LoginError("Device code expired. Run `indus login` again.");
      default:
        throw new LoginError(
          `Authorization error: ${data.error_description ?? code}`,
        );
    }
  }
  throw new LoginError("Timed out waiting for authorization. Run `indus login` again.");
}

/**
 * Drive the indus-server device-authorization flow through the framework's
 * generic {@link OAuthLoginCallbacks} shape.
 */
export async function runServerTierLogin(
  callbacks: OAuthLoginCallbacks,
  serverUrl: string = INDUS_SERVER_URL,
  clientId: string = INDUS_CLIENT_ID,
): Promise<void> {
  const device = await requestDeviceCode(serverUrl, clientId);
  callbacks.onAuth({
    url: device.verification_uri_complete ?? device.verification_uri ?? "",
    instructions: `Enter code ${device.user_code} to authorize this device.`,
  });
  callbacks.onProgress?.("Waiting for authorization...");
  const token = await pollForToken(serverUrl, clientId, device);
  await storeServerToken(token);
  callbacks.onProgress?.("Server sign-in complete.");
}

async function doLogin(args: LoginArgs): Promise<number> {
  const { serverUrl, clientId } = args;
  out();
  out(chalk.bold.cyan("  indus login"));
  out(chalk.dim(`  ${serverUrl}`));
  out();
  const existing = await getServerToken();
  if (existing && !isServerTokenExpired(existing)) {
    const again = await confirm(
      chalk.yellow("Already authenticated. Log in again?"),
      false,
    );
    if (!again) {
      out(chalk.dim("  Login cancelled \u2014 existing session preserved."));
      return EXIT_OK;
    }
  }
  try {
    out(chalk.dim("  Requesting device authorization..."));
    const device = await requestDeviceCode(serverUrl, clientId);
    const url = device.verification_uri_complete ?? device.verification_uri ?? "";
    out();
    out(`  ${chalk.bold("Open this URL to authorize:")}`);
    out(`    ${chalk.green.underline(url)}`);
    out();
    out(`  ${chalk.bold("Verification code:")} ${chalk.bold.cyan(device.user_code ?? "")}`);
    out(
      chalk.dim(
        `  Expires in ${Math.max(1, Math.floor((device.expires_in ?? 0) / 60))} min \xB7 polling every ${Math.max(
          1,
          device.interval ?? 5,
        )}s`,
      ),
    );
    out();
    out(chalk.dim("  Waiting for authorization..."));
    const token = await pollForToken(serverUrl, clientId, device);
    const saved = await storeServerToken(token);
    out();
    out(chalk.green.bold("  Authentication successful."));
    if (saved) {
      out(chalk.dim(`  Token stored at ${TOKEN_FILE}`));
    } else {
      out(
        chalk.yellow(
          "  Warning: could not write the token to disk \u2014 you may need to log in again.",
        ),
      );
    }
    out();
    return EXIT_OK;
  } catch (error) {
    const message =
      error instanceof LoginError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error);
    err("");
    err(chalk.red(`  Login failed: ${message}`));
    err("");
    return EXIT_FAILURE;
  }
}

async function doLogout(): Promise<number> {
  const cleared = await clearServerToken();
  if (cleared) {
    out(chalk.green("  Logged out \u2014 server session token removed."));
  } else {
    out(chalk.dim("  No stored session token to remove."));
  }
  return EXIT_OK;
}

async function doWhoami(args: LoginArgs): Promise<number> {
  const token = await getServerToken();
  if (!token || isServerTokenExpired(token)) {
    err(chalk.yellow("  Not logged in. Run `indus login` first."));
    return EXIT_FAILURE;
  }
  try {
    const res = await fetch(`${args.serverUrl}/api/user/me`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token.access_token}`,
        accept: "application/json",
        "user-agent": USER_AGENT,
      },
    });
    if (res.status === 401) {
      err(chalk.yellow("  Session expired or invalid. Run `indus login` again."));
      return EXIT_FAILURE;
    }
    if (!res.ok) {
      err(chalk.red(`  Could not fetch account: HTTP ${res.status}`));
      return EXIT_FAILURE;
    }
    const user = (await res.json()) as {
      name?: string;
      email?: string;
      plan?: string;
      monthlyTokenLimit?: number;
    };
    out();
    out(chalk.bold("  Signed in as:"));
    out(`    ${chalk.bold(user.name || user.email || "")} ${chalk.dim(`<${user.email}>`)}`);
    out(`    ${chalk.dim("plan:")} ${user.plan}`);
    out(
      `    ${chalk.dim("monthly token limit:")} ${(user.monthlyTokenLimit ?? 0).toLocaleString()}`,
    );
    out();
    return EXIT_OK;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    err(chalk.red(`  Could not reach the server: ${message}`));
    return EXIT_FAILURE;
  }
}

/**
 * Route a `login` / `logout` / `whoami` verb, if this invocation is one.
 */
export async function runLogin(ctx: BootContext): Promise<number | undefined> {
  const verb = ctx.argv[0];
  if (verb !== "login" && verb !== "logout" && verb !== "whoami") {
    return undefined;
  }
  const args = parseLoginArgs(ctx.argv.slice(1));
  switch (verb) {
    case "login":
      return doLogin(args);
    case "logout":
      return doLogout();
    case "whoami":
      return doWhoami(args);
  }
  return undefined;
}