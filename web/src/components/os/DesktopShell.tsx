import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AppWindow, Bell, Check, CloudSun, Maximize2, Minimize2, Settings, StickyNote, Trash2, X,
  type LucideIcon,
} from "lucide-react";
import { Button, wallpaperCss } from "@fadymondy/nasaq/web";
import type { DesktopPrefs, IconPos, OSApp, OSNotification, WeatherData } from "../../lib/os-kit";
import { wallpaperById } from "../../lib/os-kit";
import type { Me } from "../../lib/auth";

// A small windowed desktop: wallpaper, top bar, draggable icons, dock and
// draggable windows. The Nasaq kit has no desktop shell, so this is app-local
// and built only from Nasaq tokens/components.

const ICONS: Record<string, LucideIcon> = {
  "sticky-note": StickyNote,
  settings: Settings,
  "cloud-sun": CloudSun,
  "trash-2": Trash2,
};
export function appIcon(name: string): LucideIcon {
  return ICONS[name] ?? AppWindow;
}

export interface WindowSpec {
  slug: string;
  title: string;
  icon: string;
  width?: number;
  height?: number;
  section?: string;
  content?: ReactNode;
}

export interface DesktopApi {
  open: (slug: string, section?: string) => void;
  openWindow: (spec: WindowSpec) => void;
}

interface WinState extends WindowSpec {
  nonce: number;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  max: boolean;
}

const WindowSectionCtx = createContext<{ section?: string; nonce: number }>({ nonce: 0 });
/** The section a window was opened/re-targeted to (e.g. open("prefs", "wallpaper")). */
export function useWindowSection() {
  return useContext(WindowSectionCtx);
}

export interface DesktopShellProps {
  prefs: DesktopPrefs;
  apps: OSApp[];
  renderApp: (app: OSApp) => ReactNode;
  onReady: (api: DesktopApi) => void;
  onIconMove: (slug: string, pos: IconPos) => void;
  onPinDock: (slug: string) => void;
  onUnpinDock: (slug: string) => void;
  notifications: OSNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (url: string) => void;
  onContextAction: (action: "change-wallpaper" | "personalize") => void;
  onTrash: () => void;
  topBar: {
    me: Me | null;
    onLogout: () => void;
    weather: WeatherData | null;
    onWeatherClick: () => void;
    label: string;
    logo: ReactNode;
    onAbout: () => void;
    onSettings: () => void;
  };
}

export function DesktopShell(p: DesktopShellProps) {
  const [wins, setWins] = useState<WinState[]>([]);
  const zRef = useRef(10);
  const nonceRef = useRef(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [iconMenu, setIconMenu] = useState<{ x: number; y: number; slug: string } | null>(null);
  const appsRef = useRef(p.apps);
  appsRef.current = p.apps;

  const openWindow = useCallback((spec: WindowSpec) => {
    setWins((cur) => {
      const z = ++zRef.current;
      const nonce = ++nonceRef.current;
      const existing = cur.find((w) => w.slug === spec.slug);
      if (existing) {
        return cur.map((w) => (w.slug === spec.slug ? { ...w, z, nonce, section: spec.section ?? w.section } : w));
      }
      const w = Math.min(spec.width ?? 720, window.innerWidth - 16);
      const h = Math.min(spec.height ?? 520, window.innerHeight - 120);
      const off = (cur.length % 6) * 28;
      return [...cur, {
        ...spec, nonce, z, w, h, max: window.innerWidth < 640,
        x: Math.max(8, (window.innerWidth - w) / 2 + off - 60),
        y: Math.max(48, 64 + off),
      }];
    });
  }, []);

  const open = useCallback((slug: string, section?: string) => {
    const app = appsRef.current.find((a) => a.slug === slug);
    if (!app) return;
    // No static content: the window body is resolved via renderApp at render time.
    openWindow({ slug, title: app.name, icon: app.icon, width: app.window.width, height: app.window.height, section });
  }, [openWindow]);

  useEffect(() => { p.onReady({ open, openWindow }); }, [open, openWindow]); // eslint-disable-line react-hooks/exhaustive-deps

  const focus = (slug: string) => setWins((cur) => cur.map((w) => (w.slug === slug ? { ...w, z: ++zRef.current } : w)));
  const close = (slug: string) => setWins((cur) => cur.filter((w) => w.slug !== slug));
  const toggleMax = (slug: string) => setWins((cur) => cur.map((w) => (w.slug === slug ? { ...w, max: !w.max } : w)));
  const move = (slug: string, x: number, y: number) => setWins((cur) => cur.map((w) => (w.slug === slug ? { ...w, x, y } : w)));

  const dock = (p.prefs.dock_pinned.length > 0 ? p.prefs.dock_pinned : p.apps.map((a) => a.slug))
    .map((s) => p.apps.find((a) => a.slug === s)).filter((a): a is OSApp => !!a);
  const hidden = new Set(p.prefs.desktop_hidden);
  const desktopApps = p.apps.filter((a) => !hidden.has(a.slug));

  const closeMenus = () => { setMenu(null); setIconMenu(null); setShowNotifs(false); };
  const bg = wallpaperCss(wallpaperById(p.prefs.wallpaper).background);

  return (
    <div
      className="fixed inset-0 overflow-hidden text-foreground"
      style={{ background: bg }}
      onClick={closeMenus}
      onContextMenu={(e) => { e.preventDefault(); setIconMenu(null); setMenu({ x: e.clientX, y: e.clientY }); }}
    >
      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-[1000] flex h-9 items-center gap-3 border-b border-border bg-background/80 px-3 text-sm backdrop-blur" onClick={(e) => e.stopPropagation()}>
        <span className="flex items-center gap-2 font-semibold">{p.topBar.logo}{p.topBar.label}</span>
        <button className="text-muted-foreground hover:text-foreground" onClick={p.topBar.onAbout}>About</button>
        <button className="text-muted-foreground hover:text-foreground" onClick={p.topBar.onSettings}>Settings</button>
        <span className="ms-auto" />
        {p.topBar.weather && (
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground" onClick={p.topBar.onWeatherClick}>
            <CloudSun className="h-4 w-4" /> {Math.round(p.topBar.weather.temp)}° {p.topBar.weather.location}
          </button>
        )}
        <button className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications" onClick={() => setShowNotifs((v) => !v)}>
          <Bell className="h-4 w-4" />
          {p.unreadCount > 0 && (
            <span className="absolute -end-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center bg-primary px-1 text-[9px] text-primary-foreground">{p.unreadCount}</span>
          )}
        </button>
        {p.topBar.me && <span className="hidden text-muted-foreground sm:inline">{p.topBar.me.email}</span>}
        <Button size="sm" variant="ghost" onClick={p.topBar.onLogout}>Sign out</Button>
      </header>

      {showNotifs && (
        <div className="absolute end-3 top-10 z-[1001] w-80 max-w-[calc(100vw-1.5rem)] border border-border bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-border px-3 py-2 text-sm font-medium">
            Notifications
            <button className="text-xs text-primary hover:underline" onClick={p.onMarkAllRead}>Mark all read</button>
          </div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {p.notifications.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications</li>}
            {p.notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-2 px-3 py-2">
                <button
                  className="min-w-0 flex-1 text-start"
                  onClick={() => { if (!n.read) p.onMarkRead(n.id); if (n.action_url) { p.onNavigate(n.action_url); setShowNotifs(false); } }}
                >
                  <p className={"truncate text-sm " + (n.read ? "text-muted-foreground" : "font-medium")}>{n.title}</p>
                  {n.body && <p className="truncate text-xs text-muted-foreground">{n.body}</p>}
                </button>
                {!n.read && <Check className="mt-1 h-3.5 w-3.5 text-primary" />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Desktop icons */}
      {desktopApps.map((a, i) => (
        <DesktopIcon
          key={a.slug}
          app={a}
          pos={p.prefs.icon_positions[a.slug] ?? { x: 24, y: 56 + i * 96 }}
          onMove={(pos) => p.onIconMove(a.slug, pos)}
          onOpen={() => open(a.slug)}
          onContext={(x, y) => { setMenu(null); setIconMenu({ x, y, slug: a.slug }); }}
        />
      ))}

      {/* Windows */}
      {wins.map((w) => {
        const app = p.apps.find((a) => a.slug === w.slug);
        const Icon = appIcon(w.icon);
        return (
          <section
            key={w.slug}
            role="dialog"
            aria-label={w.title}
            onMouseDown={() => focus(w.slug)}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            className="absolute flex flex-col overflow-hidden border border-border bg-background shadow-2xl"
            style={w.max ? { inset: "36px 0 72px 0", zIndex: w.z } : { left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.z }}
          >
            <TitleBar
              title={w.title}
              icon={<Icon className="h-4 w-4" />}
              maximized={w.max}
              onMove={(x, y) => move(w.slug, x, y)}
              origin={{ x: w.x, y: w.y }}
              draggable={!w.max}
              onToggleMax={() => toggleMax(w.slug)}
              onClose={() => close(w.slug)}
            />
            <div className="min-h-0 flex-1 overflow-auto">
              <WindowSectionCtx.Provider value={{ section: w.section, nonce: w.nonce }}>
                {w.content ?? (app ? p.renderApp(app) : null)}
              </WindowSectionCtx.Provider>
            </div>
          </section>
        );
      })}

      {/* Context menus */}
      {menu && (
        <Menu x={menu.x} y={menu.y} items={[
          { label: "Change wallpaper", onClick: () => { closeMenus(); p.onContextAction("change-wallpaper"); } },
          { label: "Personalize", onClick: () => { closeMenus(); p.onContextAction("personalize"); } },
        ]} />
      )}
      {iconMenu && (() => {
        const pinned = dock.some((d) => d.slug === iconMenu.slug);
        return (
          <Menu x={iconMenu.x} y={iconMenu.y} items={[
            { label: "Open", onClick: () => { closeMenus(); open(iconMenu.slug); } },
            pinned
              ? { label: "Unpin from dock", onClick: () => { closeMenus(); p.onUnpinDock(iconMenu.slug); } }
              : { label: "Pin to dock", onClick: () => { closeMenus(); p.onPinDock(iconMenu.slug); } },
          ]} />
        );
      })()}

      {/* Dock */}
      <nav className="absolute inset-x-0 bottom-3 z-[1000] flex justify-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-end gap-2 border border-border bg-background/80 p-2 backdrop-blur">
          {dock.map((a) => {
            const Icon = appIcon(a.icon);
            const running = wins.some((w) => w.slug === a.slug);
            return (
              <button
                key={a.slug}
                title={a.name}
                aria-label={a.name}
                onClick={() => open(a.slug)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setMenu(null); setIconMenu({ x: e.clientX, y: e.clientY - 80, slug: a.slug }); }}
                className="relative flex h-11 w-11 items-center justify-center text-white transition-transform hover:-translate-y-1"
                style={{ background: a.color }}
              >
                <Icon className="h-6 w-6" />
                {running && <span className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-foreground" />}
              </button>
            );
          })}
          <span className="mx-1 h-9 w-px self-center bg-border" />
          <button title="Trash" aria-label="Trash" onClick={p.onTrash} className="flex h-11 w-11 items-center justify-center bg-muted text-muted-foreground transition-transform hover:-translate-y-1">
            <Trash2 className="h-6 w-6" />
          </button>
        </div>
      </nav>
    </div>
  );
}

function Menu({ x, y, items }: { x: number; y: number; items: { label: string; onClick: () => void }[] }) {
  return (
    <ul
      className="absolute z-[1100] min-w-44 border border-border bg-card py-1 text-sm shadow-lg"
      style={{ left: Math.min(x, window.innerWidth - 190), top: Math.min(y, window.innerHeight - 100) }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((it) => (
        <li key={it.label}>
          <button className="w-full px-3 py-1.5 text-start hover:bg-muted" onClick={it.onClick}>{it.label}</button>
        </li>
      ))}
    </ul>
  );
}

function DesktopIcon({ app, pos, onMove, onOpen, onContext }: {
  app: OSApp; pos: IconPos; onMove: (pos: IconPos) => void; onOpen: () => void; onContext: (x: number, y: number) => void;
}) {
  const Icon = appIcon(app.icon);
  const [drag, setDrag] = useState<IconPos | null>(null);
  const start = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null);
  const cur = drag ?? pos;

  function down(e: React.PointerEvent) {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y, moved: false };
  }
  function moveEv(e: React.PointerEvent) {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.px, dy = e.clientY - s.py;
    if (Math.abs(dx) + Math.abs(dy) > 4) s.moved = true;
    if (s.moved) setDrag({ x: Math.max(0, s.ox + dx), y: Math.max(40, s.oy + dy) });
  }
  function up() {
    const s = start.current;
    start.current = null;
    if (s?.moved && drag) onMove(drag);
    setDrag(null);
  }

  return (
    <button
      onPointerDown={down}
      onPointerMove={moveEv}
      onPointerUp={up}
      onDoubleClick={onOpen}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContext(e.clientX, e.clientY); }}
      className="absolute z-[1] flex w-20 touch-none select-none flex-col items-center gap-1 p-1 text-white"
      style={{ left: cur.x, top: cur.y }}
    >
      <span className="flex h-12 w-12 items-center justify-center shadow-lg" style={{ background: app.color }}>
        <Icon className="h-7 w-7" />
      </span>
      <span className="max-w-full truncate text-xs drop-shadow">{app.name}</span>
    </button>
  );
}

function TitleBar({ title, icon, maximized, draggable, origin, onMove, onToggleMax, onClose }: {
  title: string; icon: ReactNode; maximized: boolean; draggable: boolean; origin: { x: number; y: number };
  onMove: (x: number, y: number) => void; onToggleMax: () => void; onClose: () => void;
}) {
  const start = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  return (
    <div
      className="flex h-9 shrink-0 touch-none select-none items-center gap-2 border-b border-border bg-muted/50 px-3 text-sm font-medium"
      onPointerDown={(e) => {
        if (!draggable || (e.target as HTMLElement).closest("button")) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        start.current = { px: e.clientX, py: e.clientY, ox: origin.x, oy: origin.y };
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (s) onMove(s.ox + e.clientX - s.px, Math.max(36, s.oy + e.clientY - s.py));
      }}
      onPointerUp={() => { start.current = null; }}
      onDoubleClick={onToggleMax}
    >
      {icon}
      <span className="flex-1 truncate">{title}</span>
      <button aria-label={maximized ? "Restore" : "Maximize"} className="text-muted-foreground hover:text-foreground" onClick={onToggleMax}>
        {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
      <button aria-label="Close" className="text-muted-foreground hover:text-foreground" onClick={onClose}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
