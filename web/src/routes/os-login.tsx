import { useNavigate } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { OSLoginScreen, type OSLoginBrand } from "@togo-framework/ui";
import { osAuthClient } from "../lib/os-auth-client";
import { APP_NAME } from "../lib/api";

const BRAND: OSLoginBrand = {
  name: APP_NAME,
  icon: <Layers className="h-7 w-7" />,
  tagline: { en: "Sign in to your desktop", ar: "سجّل الدخول إلى سطح المكتب" },
};

// A photographic wallpaper for the login/lock screen. Layered over the "aurora"
// gradient so the screen still looks right if the image can't load (offline).
const LOGIN_WALLPAPER =
  "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=2400&q=80";

export function OSLogin() {
  const nav = useNavigate();
  return (
    <OSLoginScreen
      wallpaper="aurora"
      backgroundImage={LOGIN_WALLPAPER}
      brand={BRAND}
      authClient={osAuthClient}
      onSuccess={() => nav({ to: "/desktop" })}
      onRegister={() => nav({ to: "/register" })}
    />
  );
}
