import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme, type DesktopPrefs } from "@togo-framework/ui";
import { API } from "./api";

// Shared desktop-preferences state for the whole OS session. Both the desktop
// shell (background) and the Settings window read/write the SAME state here, so
// changing the wallpaper or theme in Settings applies live everywhere (they were
// previously separate useOSSession() instances → no effect).

const DEFAULT: DesktopPrefs = {
  theme: "dark",
  accent: "#1FC7DC",
  wallpaper: "aurora",
  lock_wallpaper: "monterey",
  dock_pinned: [],
  desktop_hidden: [],
  icon_positions: {},
};

interface OSContextValue {
  prefs: DesktopPrefs;
  setWallpaper: (id: string) => void;
  setLockWallpaper: (id: string) => void;
  setThemeId: (id: string) => void;
  setIconPosition: (slug: string, pos: { x: number; y: number }) => void;
  setDockPinned: (list: string[]) => void;
  setDesktopHidden: (list: string[]) => void;
  loading: boolean;
}

const OSContext = createContext<OSContextValue | null>(null);

export function OSProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();
  const [prefs, setPrefs] = useState<DesktopPrefs>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/os/session`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { const p = { ...DEFAULT, ...d }; setPrefs(p); setTheme(p.theme); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((next: DesktopPrefs) => {
    setPrefs(next);
    fetch(`${API}/api/os/session`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
  }, []);

  const setWallpaper = useCallback((id: string) => persist({ ...prefsRef.current, wallpaper: id }), [persist]);
  const setLockWallpaper = useCallback((id: string) => persist({ ...prefsRef.current, lock_wallpaper: id }), [persist]);
  const setThemeId = useCallback((id: string) => { setTheme(id); persist({ ...prefsRef.current, theme: id }); }, [persist, setTheme]);
  const setIconPosition = useCallback((slug: string, pos: { x: number; y: number }) => {
    const cur = prefsRef.current;
    persist({ ...cur, icon_positions: { ...cur.icon_positions, [slug]: pos } });
  }, [persist]);
  const setDockPinned = useCallback((list: string[]) => persist({ ...prefsRef.current, dock_pinned: list }), [persist]);
  const setDesktopHidden = useCallback((list: string[]) => persist({ ...prefsRef.current, desktop_hidden: list }), [persist]);

  return (
    <OSContext.Provider value={{ prefs, setWallpaper, setLockWallpaper, setThemeId, setIconPosition, setDockPinned, setDesktopHidden, loading }}>
      {children}
    </OSContext.Provider>
  );
}

export function useOS(): OSContextValue {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error("useOS must be used within <OSProvider>");
  return ctx;
}
