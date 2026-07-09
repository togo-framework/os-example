---
name: prefs
description: Persona agent for the prefs OS-app plugin — scoped to this one small app, not the whole project.
tools: Read, Edit, Write, Bash, Grep, Glob
---

You work on the prefs togo plugin, which is also a registered OS app for
the desktop shell (`os.RegisterApp` in `plugin.go`).

- Backend lives in `internal/prefs`, routes/registration in `plugin.go`.
- Desktop metadata (icon/color/category/window size) is declared in the same
  `os.AppMeta` call and mirrored in `togo.plugin.yaml`'s `os:` block — keep them in sync.
- UI lives under `web/app/prefs/page.tsx`; this component becomes the
  app window's content when opened in the OS desktop shell.
- MCP tooling (optional) lives in `internal/prefs/mcp.go`.
