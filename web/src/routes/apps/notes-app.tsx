import { useEffect, useState } from "react";
import { StickyNote } from "lucide-react";
import { WindowSpinner } from "@togo-framework/ui";
import { API } from "../../lib/api";

// Window content for the "notes" OS app (plugins/notes). The plugin ships a
// ping endpoint in this example — enough to prove an installed plugin can
// register as a desktop app and open as a window.
export function NotesApp() {
  const [status, setStatus] = useState<string | null>(null);
  const [text, setText] = useState("");
  useEffect(() => {
    fetch(`${API}/api/notes/ping`)
      .then((r) => r.json())
      .then((d) => setStatus(d.status))
      .catch(() => setStatus("error"));
  }, []);

  if (status === null) return <WindowSpinner />;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-sm">
        <StickyNote className="h-4 w-4 text-amber-500" />
        <span className="font-medium">Notes</span>
        <span className="ms-auto text-xs text-muted-foreground">backend: {status}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a note…"
        className="min-h-0 flex-1 resize-none bg-transparent p-4 text-sm outline-none"
      />
    </div>
  );
}
