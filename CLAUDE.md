# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Teleprompter is a PWA teleprompter app (single `index.html` with inline CSS/JS) that displays Markdown files as scrolling prompter text. Designed to run on a smartphone inside a physical prompter housing with a 45-degree beam-splitter mirror and webcam. Includes a remote control feature to steer the prompter from a second device.

## Architecture

A zero-framework PWA: one HTML file with everything inlined (`public/index.html`), a PWA manifest, and a service worker for offline use. A minimal Node.js server (`server.js`) serves static files and provides a WebSocket relay for cross-device communication.

Key design decisions:
- All app code lives in a single `index.html` (no build step, no modules)
- Icons are inline SVGs (no Unicode emoji — they render inconsistently across platforms)
- Service Worker uses network-first strategy (ensures updates reach clients without manual cache-busting)
- WebSocket uses `noServer: true` pattern with explicit HTTP upgrade handling (more robust than path-based routing)
- No room/auth concept (single-user homelab setup)

External dependencies:
- `marked.js` via CDN (cached by service worker) — Markdown parsing
- `ws` ^8.18.0 (Node.js package) — WebSocket relay server

## UI Flow

1. **Mode selection** (first screen): "Prompter starten" or "Remote Control"
2. **Prompter mode**: File loader → scrolling text with auto-hide toolbar
3. **Remote Control mode**: Control panel with play/pause, speed, scroll, font size, mirror, jump-to-top

## Development

Preview the teleprompter locally:
```
cd teleprompter
npm install
node server.js
```

Server runs on `http://0.0.0.0:8090`. Open a second tab/device on the same URL for remote control testing.

A launch config for Claude Preview exists in `.claude/launch.json` (server name: `teleprompter`, port 8090).

No build step, no tests, no linting — this is a standalone HTML app.

## Deployment

The teleprompter runs as a Node.js Docker container on the NUC homelab (192.168.2.65) via Portainer (port 9000). After changes to the app:

1. Regenerate `teleprompter-stack.yml` (base64-encodes all files into docker-compose)
2. Update the stack in Portainer (http://192.168.2.65:9000)

See `teleprompter/README.md` for the exact shell commands to generate the stack file.

Production URL: http://192.168.2.65:8090

## Known Issues

- Safari on macOS hangs on WebSocket connections to bare IP addresses (e.g. `ws://192.168.2.65:8090`). HTTP works fine, only the WebSocket upgrade is affected. Fix: use a hostname instead (`teleprompter.local`), configured via `/etc/hosts` on each Mac. iOS Safari is not affected.

Production URL via hostname: http://teleprompter.local:8090 (requires `/etc/hosts` entry on each Mac)
