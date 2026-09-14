import { Layers } from "lucide-react";
import { wallpaperCss } from "@togo-framework/ui";

// OS-style boot/transition loader — shown by the router while a route's
// beforeLoad guard runs or a lazy chunk loads. Replaces the Sentra-branded
// SentraLoading so the loading state matches the desktop OS look.
export function OSLoader() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6"
      style={{ background: wallpaperCss("aurora") }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center gap-5 text-white">
        <div className="flex h-20 w-20 items-center justify-center border border-white/25 bg-black/40">
          <Layers className="h-10 w-10" strokeWidth={1.5} />
        </div>
        <span className="h-1 w-24 animate-pulse bg-white/70" role="status" aria-label="Loading" />
      </div>
    </div>
  );
}
