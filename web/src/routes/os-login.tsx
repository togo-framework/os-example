import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, Layers, Terminal } from "lucide-react";
import { LoginForm, wallpaperCss, type OAuthProvider } from "@fadymondy/nasaq/web";
import { auth, clearSession, type AuthMethod } from "../lib/auth";
import { API, APP_NAME } from "../lib/api";
import { useLang } from "../lib/i18n";
import { wallpaperById } from "../lib/os-kit";

// The OS lock screen: a wallpaper with a sign-in card on top. Uses the same
// /api/auth/* client and Nasaq LoginForm as the plain login page.
export function OSLogin() {
  const nav = useNavigate();
  const { tx } = useLang();
  const [methods, setMethods] = useState<AuthMethod[]>([]);
  useEffect(() => { auth.methods().then(setMethods); }, []);

  const BUILT_IN = ["google", "github", "apple", "microsoft"] as const;
  const providers: OAuthProvider[] = methods.map((m) =>
    (BUILT_IN as readonly string[]).includes(m.name)
      ? (m.name as (typeof BUILT_IN)[number])
      : { id: m.name, label: m.label, icon: m.type === "dev" ? <Terminal /> : <KeyRound /> });
  async function onOAuth(id: string) {
    const m = methods.find((x) => x.name === id);
    if (!m) return;
    if (m.type === "dev") {
      await fetch(`${API}${m.url}`, { method: "POST", credentials: "include" });
      clearSession();
      nav({ to: "/desktop" });
    } else window.location.href = `${API}${m.url}`;
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-4"
      style={{ background: wallpaperCss(wallpaperById("monterey").background) }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm border border-border bg-background/90 p-6 shadow-2xl backdrop-blur">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center border border-border bg-primary/10 text-primary">
            <Layers className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-semibold">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">{tx("Sign in to your desktop", "سجّل الدخول إلى سطح المكتب")}</p>
        </div>
        <LoginForm
          showRemember={false}
          forgotPassword={<Link to="/reset" className="text-body-sm text-primary hover:underline">{tx("Forgot password?", "نسيت كلمة المرور؟")}</Link>}
          oauthProviders={providers.length ? providers : undefined}
          onOAuth={onOAuth}
          onSubmit={async ({ email, password }) => {
            try { await auth.login(email, password); } catch (e) { return { error: (e as Error).message }; }
            clearSession();
            nav({ to: "/desktop" });
          }}
        />
        <p className="mt-4 text-center text-body-sm text-muted-foreground">
          {tx("No account?", "ليس لديك حساب؟")}{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">{tx("Create one", "أنشئ حسابًا")}</Link>
        </p>
      </div>
    </div>
  );
}
