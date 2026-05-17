# Teleprompter PWA

A lightweight web app that displays Markdown files as scrolling teleprompter text. Built for a DIY prompter housing with a 45-degree beam-splitter mirror and webcam, but works on any device with a browser.

```
  [Camera]
     |
 [===========]  <-- Beam splitter (45 degrees)
     |
 [Smartphone]   <-- displays mirrored text
```

## Features

- **Markdown support** -- load a local file (.md/.txt) or paste a URL
- **Mirroring** -- vertical flip for beam-splitter prompter housings, toggleable
- **Auto-scroll** -- play/pause with adjustable speed (7 steps, 30-200 px/s)
- **Manual scroll** -- touch/swipe anytime, even during auto-scroll
- **Font size** -- adjustable via A+/A- buttons
- **Fullscreen** -- via Fullscreen API (Android/Desktop) or PWA install (iOS)
- **Remote Control** -- control the prompter from a second device via WebSocket
- **Keyboard / Bluetooth remote** -- Space, arrow keys, Page Up/Down
- **Offline capable** -- works without network after first load (PWA with Service Worker)

## Quick Start

```bash
git clone https://github.com/maikpurrmann/teleprompter-pwa.git
cd teleprompter-pwa/teleprompter
npm install
node server.js
```

Open `http://localhost:8090` in your browser.

### With Docker

```bash
git clone https://github.com/maikpurrmann/teleprompter-pwa.git
cd teleprompter-pwa
docker compose up -d
```

The app runs on port 8090.

## Remote Control

One device runs the prompter, another device controls it -- both connect to the same server.

1. **Prompter device:** Open the app -> "Prompter starten" -> load a file
2. **Control device:** Open the same URL -> "Remote Control"
3. Control via buttons or keyboard (Space, arrow keys)

Both devices must be on the same network. No pairing or room codes needed.

## Keyboard Shortcuts

| Key                  | Action                 |
|----------------------|------------------------|
| Space / Enter        | Play / Pause           |
| Arrow Up / Page Up   | Scroll up              |
| Arrow Down / Page Down | Scroll down          |
| Arrow Right          | Speed up               |
| Arrow Left           | Speed down             |

Works in both Prompter and Remote Control mode. Compatible with Bluetooth presenter remotes.

## Fullscreen

- **iPhone:** Open URL in Safari -> Share -> "Add to Home Screen"
- **Android:** Use the fullscreen button in the toolbar, or install as PWA via browser menu
- **Desktop:** Fullscreen button in the toolbar

## Known Issues

- **Safari on macOS:** WebSocket connections to bare IP addresses may hang. Use a hostname instead (e.g. add `<server-ip> teleprompter.local` to `/etc/hosts`). iOS Safari is not affected.

## Tech Stack

- Single HTML file with inline CSS/JS, no framework, no build step
- Node.js server with WebSocket relay (using `ws` library)
- `marked.js` via CDN for Markdown rendering
- Service Worker for offline caching
