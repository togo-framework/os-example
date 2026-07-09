// Adapts this app's existing /api/auth/* client (lib/auth.ts) to the
// AuthClient interface OSLoginScreen's LoginForm expects. Only login is
// exercised end-to-end in this example; the optional/less-common flows throw
// so LoginForm fails closed instead of silently no-op'ing.
import type { AuthClient, LoginResult, OtpResult, Verify2FAResult } from "@togo-framework/ui";
import { auth, clearSession } from "./auth";
import { API } from "./api";

export const osAuthClient: AuthClient = {
  async login(email, password): Promise<LoginResult> {
    await auth.login(email, password);
    clearSession();
    return { challenge: "none" };
  },
  async sendOtp(email) {
    await auth.requestOtp(email);
  },
  async verifyOtp(email, code): Promise<OtpResult> {
    await auth.verifyOtp(email, code);
    clearSession();
    return { challenge: "none" };
  },
  async forgotPassword(email) {
    await auth.requestOtp(email, "reset");
  },
  async resetPassword(): Promise<void> {
    throw new Error("password reset is not wired in this example app");
  },
  async verify2FA(): Promise<Verify2FAResult> {
    throw new Error("2FA is not wired in this example app");
  },
  // One-click dev login — the auth-dev plugin advertises this method at
  // /api/auth/methods (type "dev"). Present only in non-production.
  async devLogin(): Promise<void> {
    const list = await auth.methods();
    const dev = list.find((m) => m.type === "dev");
    if (!dev) throw new Error("dev login is not enabled");
    const res = await fetch(`${API}${dev.url}`, { method: "POST", credentials: "include" });
    if (!res.ok) throw new Error(`dev login failed (${res.status})`);
    clearSession();
  },
};
