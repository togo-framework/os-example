import { useEffect, useMemo, useState } from "react";
import { Palette, Image as ImageIcon, Lock, Info, Search, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { wallpapers, wallpaperSwatch, themes, useTheme, useWindowSection } from "@togo-framework/ui";
import { useOS } from "../../lib/os-context";
import { APP_NAME } from "../../lib/api";

type Section = "appearance" | "wallpaper" | "lock-screen" | "about";

interface NavItem {
  id: Section;
  label: string;
  icon: typeof Palette;
  color: string;
  keywords: string;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

// Two-level sidebar (macOS System Settings style): grouped headers with items
// underneath. Search flattens across all groups.
const GROUPS: NavGroup[] = [
  {
    title: "Appearance",
    items: [
      { id: "appearance", label: "System Theme", icon: Palette, color: "#8b5cf6", keywords: "theme dark light accent color mode appearance" },
      { id: "wallpaper", label: "Wallpaper", icon: ImageIcon, color: "#0ea5e9", keywords: "background desktop image picture" },
      { id: "lock-screen", label: "Lock Screen", icon: Lock, color: "#10b981", keywords: "login sign in password screensaver lock" },
    ],
  },
  {
    title: "System",
    items: [{ id: "about", label: "About", icon: Info, color: "#64748b", keywords: "version info system credits" }],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

// macOS System Settings-style window: a two-level left sidebar + a content
// pane. Changes go through the shared OS context so they apply to the live
// desktop immediately (and persist server-side via /api/os/session).
export function SettingsApp() {
  const [section, setSection] = useState<Section>("appearance");
  const [query, setQuery] = useState("");
  // On phones the window is narrow, so use iOS-style drill-in: the list and the
  // detail pane are shown one at a time instead of side-by-side.
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const { prefs } = useOS();
  const win = useWindowSection();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const goto = (id: Section) => { setSection(id); setQuery(""); setMobileDetail(true); };

  // Deep-link: when opened/re-targeted to a section (e.g. right-click desktop →
  // "Change wallpaper" → open("prefs", "wallpaper")), jump straight there.
  useEffect(() => {
    if (win.section && ALL_ITEMS.some((i) => i.id === win.section)) {
      setSection(win.section as Section);
      setQuery("");
      setMobileDetail(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win.nonce]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? ALL_ITEMS.filter((i) => (i.label + " " + i.keywords).toLowerCase().includes(q)) : null),
    [q],
  );

  const showList = !isMobile || !mobileDetail;
  const showDetail = !isMobile || mobileDetail;
  const activeLabel = ALL_ITEMS.find((i) => i.id === section)?.label ?? "Settings";

  return (
    <div className="flex h-full min-h-[440px] bg-background">
      {/* Sidebar — full-width on mobile (list view), fixed rail on desktop */}
      <aside
        className={
          "flex-col gap-1 overflow-y-auto border-border bg-muted/30 p-3 " +
          (isMobile ? "w-full border-e-0 " : "w-60 shrink-0 border-e ") +
          (showList ? "flex" : "hidden")
        }
      >
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-lg border border-border bg-background/60 py-1.5 pe-2 ps-8 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {matches ? (
          // Flattened search results.
          matches.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">No results for “{query}”.</p>
          ) : (
            matches.map((n) => (
              <NavButton key={n.id} item={n} active={!isMobile && section === n.id} onClick={() => goto(n.id)} showChevron />
            ))
          )
        ) : (
          GROUPS.map((g) => (
            <div key={g.title} className="mb-2">
              <div className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</div>
              {g.items.map((n) => (
                <NavButton key={n.id} item={n} active={!isMobile && section === n.id} onClick={() => goto(n.id)} showChevron={isMobile} />
              ))}
            </div>
          ))
        )}
      </aside>

      {/* Content */}
      <div className={"min-w-0 flex-1 overflow-y-auto p-6 " + (showDetail ? "block" : "hidden")}>
        {isMobile && (
          <button
            onClick={() => setMobileDetail(false)}
            className="mb-4 -ms-1 flex items-center gap-1 text-sm font-medium text-primary"
          >
            <ChevronLeft className="h-4 w-4" /> Settings
          </button>
        )}
        {section === "appearance" && <Appearance />}
        {section === "wallpaper" && <Wallpaper current={prefs.wallpaper} />}
        {section === "lock-screen" && <LockScreen current={prefs.lock_wallpaper} />}
        {section === "about" && <About />}
        {isMobile && <p className="sr-only">{activeLabel}</p>}
      </div>
    </div>
  );
}

function NavButton({ item, active, onClick, showChevron }: { item: NavItem; active: boolean; onClick: () => void; showChevron?: boolean }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={
        "flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm transition " +
        (active ? "bg-primary text-primary-foreground" : "hover:bg-accent")
      }
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: active ? "rgba(255,255,255,0.2)" : `${item.color}22`, color: active ? "#fff" : item.color }}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 text-start">{item.label}</span>
      {showChevron && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
    </button>
  );
}

function Appearance() {
  const { theme } = useTheme();
  const { setThemeId } = useOS();
  return (
    <section>
      <h2 className="text-lg font-semibold">System Theme</h2>
      <p className="mb-4 text-sm text-muted-foreground">Set the accent color and light/dark mode for the whole desktop.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {themes.map((t) => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setThemeId(t.id)}
              className={
                "flex items-center gap-3 rounded-md border p-3 text-start transition-colors " +
                (active ? "" : "border-border/50 hover:border-border")
              }
              style={active ? { borderColor: t.accent, outline: `1px solid ${t.accent}` } : undefined}
            >
              <span className="h-8 w-8 shrink-0 rounded-full" style={{ background: t.accent }} />
              <span className="flex flex-col">
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs capitalize text-muted-foreground">{t.base}</span>
              </span>
              {active && <Check className="ms-auto h-4 w-4" style={{ color: t.accent }} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function WallpaperGrid({ current, onPick }: { current: string; onPick: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {wallpapers.map((w) => {
        const selected = current === w.id;
        const bg = w.image ? `url("${w.image}") center/cover, ${wallpaperSwatch(w.id)}` : wallpaperSwatch(w.id);
        return (
          <button key={w.id} onClick={() => onPick(w.id)} className="flex flex-col items-center gap-1.5">
            <span
              className="relative h-24 w-full border-2 transition-colors"
              style={{ background: bg, borderColor: selected ? "var(--primary)" : "transparent" }}
            >
              {selected && (
                <span className="absolute end-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </span>
            <span className={selected ? "text-xs font-medium" : "text-xs text-muted-foreground"}>{w.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Wallpaper({ current }: { current: string }) {
  const { setWallpaper } = useOS();
  return (
    <section>
      <h2 className="text-lg font-semibold">Wallpaper</h2>
      <p className="mb-4 text-sm text-muted-foreground">Choose the desktop background. Changes apply instantly.</p>
      <WallpaperGrid current={current} onPick={setWallpaper} />
    </section>
  );
}

function LockScreen({ current }: { current: string }) {
  const { setLockWallpaper } = useOS();
  const active = wallpapers.find((w) => w.id === current) ?? wallpapers[0];
  const previewBg = active.image ? `url("${active.image}") center/cover, ${wallpaperSwatch(active.id)}` : wallpaperSwatch(active.id);
  return (
    <section>
      <h2 className="text-lg font-semibold">Lock Screen</h2>
      <p className="mb-4 text-sm text-muted-foreground">Pick the background shown on the sign-in / lock screen.</p>

      {/* Live preview of the lock screen */}
      <div
        className="mb-5 flex h-40 w-full items-center justify-center border border-border"
        style={{ background: previewBg }}
      >
        <div className="flex flex-col items-center gap-2 border border-white/20 bg-black/50 px-6 py-4">
          <span className="h-10 w-10 rounded-full bg-white/80" />
          <span className="text-xs font-medium text-white">Sign in to {APP_NAME}</span>
        </div>
      </div>

      <WallpaperGrid current={current} onPick={setLockWallpaper} />
    </section>
  );
}

function About() {
  return (
    <section className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center border border-border bg-primary/10 text-primary">
        <Info className="h-9 w-9" />
      </div>
      <h2 className="text-xl font-semibold">{APP_NAME}</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        An OS-style desktop built with the togo <code>os</code> plugin. Every app (Notes, Settings, Weather)
        is a self-contained togo plugin packaged with UI, backend, MCP, and Claude agents.
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <dt className="text-muted-foreground">System</dt><dd>togo OS</dd>
        <dt className="text-muted-foreground">Backend</dt><dd>Go + chi</dd>
        <dt className="text-muted-foreground">Frontend</dt><dd>React + TanStack</dd>
      </dl>
    </section>
  );
}
