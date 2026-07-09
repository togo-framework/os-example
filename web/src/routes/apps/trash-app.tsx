import { useState } from "react";
import { Trash2, FileText, Image as ImageIcon, FileArchive, RotateCcw, X } from "lucide-react";

interface TrashItem { id: string; name: string; kind: "doc" | "image" | "archive"; size: string; }

const SEED: TrashItem[] = [
  { id: "1", name: "old-notes.txt", kind: "doc", size: "12 KB" },
  { id: "2", name: "screenshot-2026.png", kind: "image", size: "1.4 MB" },
  { id: "3", name: "backup.zip", kind: "archive", size: "40 MB" },
  { id: "4", name: "draft.md", kind: "doc", size: "6 KB" },
];

const ICONS = { doc: FileText, image: ImageIcon, archive: FileArchive };

// A small Finder/Trash-style file browser: lists items in the Trash with the
// ability to delete one, restore one, or empty the whole bin.
export function TrashApp() {
  const [items, setItems] = useState<TrashItem[]>(SEED);

  return (
    <div className="flex h-full min-h-[360px] flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 font-medium">
          <Trash2 className="h-4 w-4 text-muted-foreground" /> Trash
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        <button
          onClick={() => setItems([])}
          disabled={!items.length}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium transition hover:bg-accent disabled:opacity-40"
        >
          Empty Trash
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Trash2 className="h-10 w-10 opacity-40" />
          <p className="text-sm">Trash is empty</p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-border overflow-y-auto">
          {items.map((it) => {
            const Icon = ICONS[it.kind];
            return (
              <li key={it.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.size}</p>
                </div>
                <button
                  title="Restore"
                  onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}
                  className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  title="Delete permanently"
                  onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}
                  className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
