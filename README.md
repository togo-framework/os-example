<!-- togo-header -->
<div align="center">
  <img src=".github/assets/togo-mark.svg" alt="togo" height="64" />
  <h1>togo-framework/os-example</h1>
  <p>
    <a href="https://to-go.dev/marketplace"><img src="https://img.shields.io/badge/marketplace-to--go.dev-1FC7DC" alt="marketplace" /></a>
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" />
  </p>
  <p><strong>A live demo of the <a href="https://github.com/togo-framework/os">togo <code>os</code></a> desktop shell.</strong></p>
</div>

<!-- /togo-header -->

# os-example — the togo OS desktop, end to end

A generated togo app that boots straight into a **macOS-style desktop**: a
wallpapered lock/login screen, a desktop with draggable icons, a dock, Launchpad,
Spotlight, a notification center, and draggable / resizable / snappable windows —
all responsive down to a phone (windows go full-screen, iOS-style).

It ships three self-contained **OS apps** (each a togo plugin under
[`plugins/`](plugins/) packaged with UI + backend + MCP + Claude agent):

| App | What it shows |
|---|---|
| **Settings** | macOS System Settings clone — live theme (8 themes), wallpaper, lock screen; changes persist via `/api/os/session` |
| **Notes** | a simple CRUD app in a window |
| **Weather** | proxies open-meteo, with a graceful fallback |

## Run

```bash
togo generate && togo migrate && togo serve
# API → :8091 (or :8080)   ·   Web → :3091 (or :3000)
```

Log in with **Continue as developer** (the `auth-dev` plugin) to land on the
desktop.

## How it's built

- **Desktop shell** — the [`@togo-framework/ui`](https://github.com/togo-framework/ui)
  `DesktopShell` / `Window` / `Dock` / `Launchpad` / `Spotlight` components.
- **Backend** — the [`os`](https://github.com/togo-framework/os) plugin (session +
  app registry) plus `auth`, `settings`, `plugin-host`, `notification-center`.
- **Apps** — added with `togo make:os-app <name>`; each calls `os.RegisterApp(...)`.

> This repo is part of the flat `togo-framework` workspace checkout: its `go.mod`
> uses a `replace` for the sibling `os` module during local development. To start
> your own OS app from scratch, run `togo new <app> --frontend os`.

<!-- togo-sponsors -->
---

<div align="center">
  <h3>Premium sponsors</h3>
  <p>
    <a href="https://id8media.com"><strong>ID8 Media</strong></a> &nbsp;·&nbsp;
    <a href="https://one-studio.co"><strong>One Studio</strong></a>
  </p>
  <p><sub>Support togo — <a href="https://github.com/sponsors/fadymondy">become a sponsor</a>.</sub></p>
</div>
<!-- /togo-sponsors -->
