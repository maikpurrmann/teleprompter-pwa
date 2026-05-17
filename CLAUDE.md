# Teleprompter PWA

## Deployment

The app runs on an ARM-based server managed via **Portainer** (Docker stack).

### How deployment works

There is no Docker image registry or build step on the server. Instead, the entire app is embedded as **base64-encoded files** directly in the `docker-compose.yml` stack definition. On container start, the files are decoded, `npm install` runs, and the server starts.

The stack YAML looks like this:

```yaml
services:
  teleprompter:
    image: node:22-alpine
    container_name: teleprompter
    ports:
      - "8090:8090"
    restart: unless-stopped
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        mkdir -p /app/public
        echo '<base64 of server.js>' | base64 -d > /app/server.js
        echo '<base64 of package.json>' | base64 -d > /app/package.json
        echo '<base64 of index.html>' | base64 -d > /app/public/index.html
        echo '<base64 of manifest.json>' | base64 -d > /app/public/manifest.json
        echo '<base64 of sw.js>' | base64 -d > /app/public/sw.js
        cd /app && npm install --production && node server.js
```

### How to generate the deploy YAML

To produce a ready-to-paste Portainer stack with the current file contents:

```bash
cd teleprompter
SERVER_B64=$(base64 -i server.js | tr -d '\n')
PKG_B64=$(base64 -i package.json | tr -d '\n')
INDEX_B64=$(base64 -i public/index.html | tr -d '\n')
MANIFEST_B64=$(base64 -i public/manifest.json | tr -d '\n')
SW_B64=$(base64 -i public/sw.js | tr -d '\n')
```

Then assemble the YAML with these variables substituted into the template above.

### Deploy workflow

1. Make code changes and push to `main`
2. Generate the Portainer YAML (with base64-encoded files)
3. Copy to clipboard so the user can paste it into the Portainer stack editor
4. User updates the stack in Portainer

The `docker-compose.yml` in the repo (using `build: ./teleprompter`) is for local development only — Portainer uses the inline base64 stack.

## Architecture

- Single HTML file (`public/index.html`) with inline CSS/JS
- Node.js server (`server.js`) serves static files + WebSocket relay
- No build step, no framework
- Service Worker (`public/sw.js`) for offline caching
- `marked.js` loaded via CDN

## Platform notes

- **Wake Lock API** requires HTTPS (Secure Context) on all platforms. A LAN IP like `192.168.x.x` is NOT a secure context — only `localhost` is. Since the app is accessed over HTTP on the local network, the Wake Lock API is not available.
- Instead, the app shows a one-time dismissable hint on mobile devices pointing to the OS screen timeout settings (iOS: Auto-Lock, Android: Screen timeout).
