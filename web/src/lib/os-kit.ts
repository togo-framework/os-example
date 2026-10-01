// Local desktop-OS types and data. The Nasaq kit has no desktop shell, so the
// shell (components/os/DesktopShell.tsx) and these shapes live in the app.
import { useEffect, useState } from "react";
import type { AppearanceWallpaper } from "@fadymondy/nasaq/web";
import { API } from "./api";

export interface IconPos { x: number; y: number }

/** Mirrors github.com/togo-framework/os DesktopPrefs (GET/PUT /api/os/session). */
export interface DesktopPrefs {
  theme: string;
  accent: string;
  wallpaper: string;
  lock_wallpaper: string;
  dock_pinned: string[];
  desktop_hidden: string[];
  icon_positions: Record<string, IconPos>;
}

/** Mirrors the os plugin's App (GET /api/os/apps). */
export interface OSApp {
  slug: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  window: { width: number; height: number; resizable: boolean };
  enabled: boolean;
}

/** notification-center plugin notification. */
export interface OSNotification {
  id: string;
  title: string;
  body?: string;
  action_url?: string;
  read: boolean;
  created_at: string;
}

export interface WeatherData { temp: number; condition: string; location: string }

export const wallpapers: AppearanceWallpaper[] = [
  { id: "aurora", label: "Aurora", background: "linear-gradient(135deg,#0f2027 0%,#1f8a99 50%,#2c5364 100%)", group: "Gradients" },
  { id: "dusk", label: "Dusk", background: "linear-gradient(135deg,#2b1055 0%,#7597de 100%)", group: "Gradients" },
  { id: "ember", label: "Ember", background: "linear-gradient(135deg,#42275a 0%,#734b6d 50%,#f5a25d 100%)", group: "Gradients" },
  { id: "forest", label: "Forest", background: "linear-gradient(135deg,#0b3d2e 0%,#2e7d5b 100%)", group: "Gradients" },
  { id: "graphite", label: "Graphite", background: "linear-gradient(135deg,#1c1c1e 0%,#3a3a3c 100%)", group: "Gradients" },
  { id: "monterey", label: "Monterey", background: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=2400&q=80", group: "Photos" },
];

export function wallpaperById(id: string): AppearanceWallpaper {
  return wallpapers.find((w) => w.id === id) ?? wallpapers[0];
}

/** Installed OS apps from the os plugin, enabled only. */
export function useOSApps(): { apps: OSApp[]; loading: boolean } {
  const [apps, setApps] = useState<OSApp[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/os/apps`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && Array.isArray(d)) setApps((d as OSApp[]).filter((a) => a.enabled !== false)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return { apps, loading };
}
