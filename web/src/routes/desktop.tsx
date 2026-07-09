import { useEffect, useRef, useState, type JSX } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Layers, Trash2 } from "lucide-react";
import {
  DesktopShell,
  useOSApps,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  type OSApp,
  type OSNotification,
  type WeatherData,
  type DesktopApi,
} from "@togo-framework/ui";
import { auth, clearSession, type Me } from "../lib/auth";
import { notifications as notifApi } from "../lib/notifications";
import { API, APP_NAME } from "../lib/api";
import { OSProvider, useOS } from "../lib/os-context";
import { NotesApp } from "./apps/notes-app";
import { SettingsApp } from "./apps/settings-app";
import { WeatherApp } from "./apps/weather-app";
import { TrashApp } from "./apps/trash-app";

const WINDOW_CONTENT: Record<string, () => JSX.Element> = {
  notes: NotesApp,
  prefs: SettingsApp,
  weather: WeatherApp,
};

export default function Desktop() {
  // OSProvider holds the shared desktop prefs so Settings changes apply live.
  return (
    <OSProvider>
      <DesktopInner />
    </OSProvider>
  );
}

function DesktopInner() {
  const nav = useNavigate();
  const { prefs, setIconPosition, setDockPinned, setDesktopHidden } = useOS();
  const { apps } = useOSApps();

  // Effective dock = explicit pin list, or every app when nothing is pinned yet.
  const effectiveDock = () => (prefs.dock_pinned.length > 0 ? prefs.dock_pinned : apps.map((a) => a.slug));
  const pinDock = (slug: string) => { const d = effectiveDock(); if (!d.includes(slug)) setDockPinned([...d, slug]); };
  const unpinDock = (slug: string) => setDockPinned(effectiveDock().filter((s) => s !== slug));
  const hideDesktop = (slug: string) => { if (!prefs.desktop_hidden.includes(slug)) setDesktopHidden([...prefs.desktop_hidden, slug]); };
  const showDesktop = (slug: string) => setDesktopHidden(prefs.desktop_hidden.filter((s) => s !== slug));
  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<OSNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const desktopRef = useRef<DesktopApi | null>(null);
  const openApp = (slug: string, section?: string) => desktopRef.current?.open(slug, section);

  useEffect(() => { auth.me().then(setMe); }, []);

  async function fetchNotifications() {
    const [list, count] = await Promise.all([notifApi.list(), notifApi.unreadCount()]);
    setItems(Array.isArray(list) ? list : []);
    setUnread(count);
  }
  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    fetch(`${API}/api/weather/current`)
      .then((r) => r.json())
      .then((d) => setWeather({ temp: d.temp, condition: d.condition, location: d.location }))
      .catch(() => {});
  }, []);

  const doLogout = () => auth.logout().then(() => { clearSession(); nav({ to: "/login" }); });

  function renderApp(app: OSApp) {
    const Content = WINDOW_CONTENT[app.slug];
    return Content ? <Content /> : <div className="p-6 text-sm text-muted-foreground">No window for "{app.slug}".</div>;
  }

  function openTrash() {
    desktopRef.current?.openWindow({ slug: "trash", title: "Trash", icon: "trash-2", width: 520, height: 420, content: <TrashApp /> });
  }

  return (
    <>
      <DesktopShell
        prefs={prefs}
        apps={apps}
        renderApp={renderApp}
        onReady={(api) => { desktopRef.current = api; }}
        iconPositions={prefs.icon_positions}
        onIconMove={setIconPosition}
        desktopHidden={prefs.desktop_hidden}
        onRemoveDesktopIcon={hideDesktop}
        onAddDesktopIcon={showDesktop}
        onPinDock={pinDock}
        onUnpinDock={unpinDock}
        notifications={items}
        unreadCount={unread}
        onMarkRead={async (id) => { await notifApi.markRead(id); fetchNotifications(); }}
        onMarkAllRead={async () => { await notifApi.markAllRead(); fetchNotifications(); }}
        onNavigate={(url) => { if (url.startsWith("/")) nav({ to: url }); }}
        onContextAction={(a) => {
          if (a === "change-wallpaper") openApp("prefs", "wallpaper");
          else if (a === "personalize") openApp("prefs", "appearance");
        }}
        onTrash={openTrash}
        topBar={{
          me,
          onLogout: doLogout,
          weather,
          onWeatherClick: () => openApp("weather"),
          menu: {
            label: APP_NAME,
            logo: <Layers className="h-4 w-4" />,
            onAbout: () => setAboutOpen(true),
            onSettings: () => openApp("prefs"),
          },
        }}
      />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}

function AboutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layers className="h-7 w-7" />
          </div>
          <DialogTitle>About {APP_NAME}</DialogTitle>
          <DialogDescription>
            A togo desktop — an OS-style shell built with the togo <code>os</code> plugin.
            Apps (Notes, Settings, Weather) are self-contained togo plugins packaged with UI, backend, MCP and Claude agents.
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">togo OS · powered by Go + React</p>
      </DialogContent>
    </Dialog>
  );
}
